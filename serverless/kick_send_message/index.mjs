/**
 * AWS Lambda: Kick API üzerinden Chat Mesajı Gönderme (Güvenli)
 * 
 * GÜVENLİK KATMANLARI:
 * 1. HMAC-SHA256 İmza Doğrulama: İstek, yayıncının gizli anahtarıyla imzalanır.
 *    Secret hiçbir zaman ağ üzerinden açık gönderilmez.
 * 2. Zaman Damgası (Replay Attack): 5 dakikadan eski istekler reddedilir.
 * 3. Rate Limiting: Aynı yayıncı 2 saniyede 1'den fazla mesaj atamaz.
 * 4. Token İzolasyonu: Her yayıncı sadece kendi token'ı ile mesaj atar.
 *    Başka bir yayıncının token'ına erişim mümkün değildir.
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { createHmac } from "crypto";

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "KickUsersTokens";
const KICK_CHAT_URL = "https://api.kick.com/public/v1/chat";
const RATE_LIMIT_MS = 2000;       // 2 saniye minimum mesaj aralığı
const MAX_TIMESTAMP_DRIFT = 300;  // 5 dakika (saniye cinsinden)

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Signature,X-Timestamp,X-User-Id'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // ── 1. İSTEK BAŞLIKLARINI DOĞRULA ──────────────────────────────
    const signature = event.headers['x-signature'] || event.headers['X-Signature'];
    const timestamp = event.headers['x-timestamp'] || event.headers['X-Timestamp'];
    const userId = event.headers['x-user-id'] || event.headers['X-User-Id'];

    if (!signature || !timestamp || !userId) {
      return {
        statusCode: 401, headers, body: JSON.stringify({
          error: "Eksik güvenlik başlıkları (X-Signature, X-Timestamp, X-User-Id)."
        })
      };
    }

    // ── 2. ZAMAN DAMGASI KONTROLÜ (Replay Attack Koruması) ─────────
    const now = Math.floor(Date.now() / 1000);
    const requestTimestamp = parseInt(timestamp, 10);
    if (isNaN(requestTimestamp) || Math.abs(now - requestTimestamp) > MAX_TIMESTAMP_DRIFT) {
      return {
        statusCode: 403, headers, body: JSON.stringify({
          error: "İstek zaman aşımına uğradı veya geçersiz zaman damgası. (Replay koruması)"
        })
      };
    }

    // ── 3. BODY PARSE ──────────────────────────────────────────────
    if (!event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Body bulunamadı." }) };
    }
    const body = JSON.parse(event.body);
    const { broadcaster_user_id, message } = body;

    if (!broadcaster_user_id || !message) {
      return {
        statusCode: 400, headers, body: JSON.stringify({
          error: "Eksik parametreler. (broadcaster_user_id, message)"
        })
      };
    }

    // ── 4. VERİTABANINDAN YAYINCIYI ÇEK ───────────────────────────
    const { Item } = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId: userId.toString() }
    }));

    if (!Item) {
      return {
        statusCode: 404, headers, body: JSON.stringify({
          error: "Bu yayıncı sistemde kayıtlı değil."
        })
      };
    }

    if (!Item.access_token) {
      return {
        statusCode: 403, headers, body: JSON.stringify({
          error: "Bu yayıncı için geçerli access_token bulunamadı. Token yenilenmesi gerekiyor olabilir."
        })
      };
    }

    if (!Item.broadcaster_secret) {
      return {
        statusCode: 403, headers, body: JSON.stringify({
          error: "Bu yayıncı için güvenlik anahtarı (broadcaster_secret) tanımlı değil."
        })
      };
    }

    // ── 5. HMAC-SHA256 İMZA DOĞRULAMASI ────────────────────────────
    // İmza = HMAC-SHA256(secret, "userId:timestamp:broadcaster_user_id:message")
    // Bu sayede secret hiçbir zaman ağ üzerinden açık gönderilmez.
    const expectedPayload = `${userId}:${timestamp}:${broadcaster_user_id}:${message}`;
    const expectedSignature = createHmac('sha256', Item.broadcaster_secret)
      .update(expectedPayload)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.warn(`İmza uyuşmazlığı: userId=${userId}`);
      return {
        statusCode: 403, headers, body: JSON.stringify({
          error: "Geçersiz imza. Bu istek yetkisiz veya değiştirilmiş."
        })
      };
    }

    // ── 6. BROADCASTER_USER_ID KONTROLÜ (Token İzolasyonu) ─────────
    // Yayıncının DynamoDB kaydındaki broadcaster_user_id ile
    // istekteki broadcaster_user_id eşleşmeli. Başkasının adına mesaj atamazsın.
    if (Item.broadcaster_user_id &&
      Item.broadcaster_user_id.toString() !== broadcaster_user_id.toString()) {
      console.warn(`Token izolasyonu ihlali: userId=${userId} farklı bir broadcaster_user_id (${broadcaster_user_id}) ile mesaj atmaya çalıştı.`);
      return {
        statusCode: 403, headers, body: JSON.stringify({
          error: "Bu token başka bir yayıncıya ait. Kendi broadcaster_user_id değerinizi kullanın."
        })
      };
    }

    // ── 7. RATE LIMITING ───────────────────────────────────────────
    const lastMessageTime = Item.last_message_time || 0;
    const nowMs = Date.now();
    if ((nowMs - lastMessageTime) < RATE_LIMIT_MS) {
      return {
        statusCode: 429, headers, body: JSON.stringify({
          error: `Rate limit: En az ${RATE_LIMIT_MS / 1000} saniye arayla mesaj gönderebilirsiniz.`
        })
      };
    }

    // ── 8. KICK CHAT API'SİNE MESAJ GÖNDER ─────────────────────────
    const chatPayload = {
      broadcaster_user_id: parseInt(broadcaster_user_id),
      content: message.substring(0, 500), // Kick max 500 karakter
      type: "bot"
    };

    const response = await fetch(KICK_CHAT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Item.access_token}`,
        'Content-Type': 'application/json',
        'Accept': '*/*'
      },
      body: JSON.stringify(chatPayload)
    });

    // ── 9. SON MESAJ ZAMANINI KAYDET (Rate Limit için) ─────────────
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { userId: userId.toString() },
      UpdateExpression: "set last_message_time = :t",
      ExpressionAttributeValues: { ":t": nowMs }
    }));

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Kick Chat API Hatası (HTTP ${response.status}):`, errText);
      return {
        statusCode: response.status, headers, body: JSON.stringify({
          error: "Mesaj Kick'e iletilemedi.", details: errText
        })
      };
    }

    const data = await response.json();
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, data }) };

  } catch (error) {
    console.error("Chat Send Error:", error);
    return {
      statusCode: 500, headers, body: JSON.stringify({
        error: "Sunucu hatası.", details: error.message
      })
    };
  }
};
