/**
 * AWS Lambda: Kick API Token Dağıtıcı (Token Broker - Güvenli)
 * 
 * GÜVENLİK KATMANLARI:
 * 1. HMAC-SHA256 İmza Doğrulama: İstek, yayıncının gizli anahtarıyla imzalanır.
 *    Secret hiçbir zaman ağ üzerinden açık gönderilmez.
 * 2. Zaman Damgası (Replay Attack): 5 dakikadan eski istekler reddedilir.
 * 3. Token İzolasyonu: Her yayıncı sadece kendi token'ını alabilir.
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { createHmac } from "crypto";

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "KickUsersTokens";
const KICK_TOKEN_URL = "https://id.kick.com/oauth/token";
const MAX_TIMESTAMP_DRIFT = 300;  // 5 dakika (saniye cinsinden)

const KICK_CLIENT_ID = process.env.KICK_CLIENT_ID;
const KICK_CLIENT_SECRET = process.env.KICK_CLIENT_SECRET;

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Signature,X-Timestamp,X-User-Id'
  };

  const httpMethod = event.httpMethod || event.requestContext?.http?.method;
  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // ── 0. PARSE BODY & DETECT MARKETPLACE REQUESTS ──────────────
    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        console.warn("Could not parse body JSON:", e.message);
      }
    }

    if (body && body.action) {
      const action = body.action;

      // ── PAZAR YERİ AKIŞI (MARKETPLACE) ─────────────────────────────
      // 1. LIST_MARKET_ITEMS
      if (action === "list_market_items") {
        const signature = event.headers['x-signature'] || event.headers['X-Signature'];
        const timestamp = event.headers['x-timestamp'] || event.headers['X-Timestamp'];
        const userId = event.headers['x-user-id'] || event.headers['X-User-Id'];

        let isAdmin = false;
        let isBroadcaster = false;

        if (signature && timestamp && userId) {
          try {
            const now = Math.floor(Date.now() / 1000);
            const requestTimestamp = parseInt(timestamp, 10);
            if (!isNaN(requestTimestamp) && Math.abs(now - requestTimestamp) <= MAX_TIMESTAMP_DRIFT) {
              const { Item } = await docClient.send(new GetCommand({
                TableName: TABLE_NAME,
                Key: { userId: userId.toString() }
              }));

              if (Item && Item.broadcaster_secret) {
                const expectedPayload = `${userId}:${timestamp}:${action}`;
                const expectedSignature = createHmac('sha256', Item.broadcaster_secret)
                  .update(expectedPayload)
                  .digest('hex');

                if (signature === expectedSignature) {
                  isBroadcaster = true;
                  const admins = ['pairaaa', 'otonomus', 'ahmetefe', 'ahmetefeyasar'];
                  if (admins.includes(userId.toLowerCase().trim())) {
                    isAdmin = true;
                  }
                }
              }
            }
          } catch (dbErr) {
            console.error("Error reading status for list_market_items:", dbErr);
          }
        }

        try {
          const scanRes = await docClient.send(new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: "begins_with(userId, :prefix)",
            ExpressionAttributeValues: {
              ":prefix": "market_item#"
            },
            ProjectionExpression: "userId, itemId, itemType, #n, developer, price, content, #s, #d, submittedAt",
            ExpressionAttributeNames: {
              "#n": "name",
              "#s": "status",
              "#d": "desc"
            }
          }));

          const isAuthorized = isAdmin || isBroadcaster;
          let items = (scanRes.Items || []).map(item => ({
            id: item.itemId,
            type: item.itemType,
            name: item.name,
            developer: item.developer,
            price: item.price,
            status: item.status,
            desc: item.desc || "",
            submittedAt: item.submittedAt,
            // Only expose code content if authorized admin or broadcaster
            ...(isAuthorized && { content: item.content })
          }));

          if (!isAdmin) {
            items = items.filter(item => item.status === "approved");
          }

          items.sort((a, b) => (b.submittedAt || "").localeCompare(a.submittedAt || ""));

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, items })
          };
        } catch (scanErr) {
          console.error("DynamoDB scan error for list_market_items:", scanErr);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Veritabanından ürünler alınamadı.", details: scanErr.message })
          };
        }
      }

      // 2. SUBMIT_MARKET_ITEM
      if (action === "submit_market_item") {
        const signature = event.headers['x-signature'] || event.headers['X-Signature'];
        const timestamp = event.headers['x-timestamp'] || event.headers['X-Timestamp'];
        const userId = event.headers['x-user-id'] || event.headers['X-User-Id'];

        if (!signature || !timestamp || !userId) {
          return { statusCode: 401, headers, body: JSON.stringify({ error: "Eksik güvenlik başlıkları." }) };
        }

        const now = Math.floor(Date.now() / 1000);
        const requestTimestamp = parseInt(timestamp, 10);
        if (isNaN(requestTimestamp) || Math.abs(now - requestTimestamp) > MAX_TIMESTAMP_DRIFT) {
          return { statusCode: 403, headers, body: JSON.stringify({ error: "Zaman aşımı (Replay koruması)." }) };
        }

        try {
          const { Item } = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { userId: userId.toString() }
          }));

          if (!Item || !Item.broadcaster_secret) {
            return { statusCode: 403, headers, body: JSON.stringify({ error: "Kullanıcı veya secret bulunamadı. Lütfen önce giriş yapın." }) };
          }

          const expectedPayload = `${userId}:${timestamp}:${action}`;
          const expectedSignature = createHmac('sha256', Item.broadcaster_secret)
            .update(expectedPayload)
            .digest('hex');

          if (signature !== expectedSignature) {
            return { statusCode: 403, headers, body: JSON.stringify({ error: "Geçersiz imza." }) };
          }

          const { itemType, name, price, content, desc } = body;
          if (!itemType || !name || content === undefined) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Eksik ürün parametreleri (itemType, name, content)." }) };
          }

          const parsedPrice = Number(price);
          if (isNaN(parsedPrice) || parsedPrice < 0) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Geçersiz veya negatif fiyat." }) };
          }

          let generatedId;
          let success = false;
          let retries = 0;
          while (!success && retries < 3) {
            generatedId = Math.floor(10000 + Math.random() * 90000).toString();
            try {
              await docClient.send(new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                  userId: `market_item#${generatedId}`,
                  itemId: generatedId,
                  itemType,
                  name,
                  developer: userId,
                  price: parsedPrice,
                  content,
                  status: "pending",
                  desc: desc || "",
                  submittedAt: new Date().toISOString()
                },
                ConditionExpression: "attribute_not_exists(userId)"
              }));
              success = true;
            } catch (err) {
              if (err.name === 'ConditionalCheckFailedException') {
                retries++;
              } else {
                throw err;
              }
            }
          }

          if (!success) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: "Benzersiz ürün ID'si oluşturulamadı." }) };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, itemId: generatedId })
          };

        } catch (dbErr) {
          console.error("Submit item error:", dbErr);
          return { statusCode: 500, headers, body: JSON.stringify({ error: "Ürün gönderilemedi.", details: dbErr.message }) };
        }
      }

      // 3. APPROVE_MARKET_ITEM
      if (action === "approve_market_item") {
        const signature = event.headers['x-signature'] || event.headers['X-Signature'];
        const timestamp = event.headers['x-timestamp'] || event.headers['X-Timestamp'];
        const userId = event.headers['x-user-id'] || event.headers['X-User-Id'];

        if (!signature || !timestamp || !userId) {
          return { statusCode: 401, headers, body: JSON.stringify({ error: "Eksik güvenlik başlıkları." }) };
        }

        const admins = ['pairaaa', 'otonomus', 'ahmetefe', 'ahmetefeyasar'];
        if (!admins.includes(userId.toLowerCase().trim())) {
          return { statusCode: 403, headers, body: JSON.stringify({ error: "Bu işlem için yönetici yetkisi gereklidir." }) };
        }

        const now = Math.floor(Date.now() / 1000);
        const requestTimestamp = parseInt(timestamp, 10);
        if (isNaN(requestTimestamp) || Math.abs(now - requestTimestamp) > MAX_TIMESTAMP_DRIFT) {
          return { statusCode: 403, headers, body: JSON.stringify({ error: "Zaman aşımı (Replay koruması)." }) };
        }

        try {
          const { Item } = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { userId: userId.toString() }
          }));

          if (!Item || !Item.broadcaster_secret) {
            return { statusCode: 403, headers, body: JSON.stringify({ error: "Yönetici secret bulunamadı." }) };
          }

          const expectedPayload = `${userId}:${timestamp}:${action}`;
          const expectedSignature = createHmac('sha256', Item.broadcaster_secret)
            .update(expectedPayload)
            .digest('hex');

          if (signature !== expectedSignature) {
            return { statusCode: 403, headers, body: JSON.stringify({ error: "Geçersiz imza." }) };
          }

          const { itemId, status } = body;
          if (!itemId || !status || !["approved", "rejected"].includes(status)) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Eksik veya geçersiz onay parametreleri (itemId, status)." }) };
          }

          await docClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { userId: `market_item#${itemId}` },
            UpdateExpression: "set #s = :status",
            ExpressionAttributeNames: {
              "#s": "status"
            },
            ExpressionAttributeValues: {
              ":status": status
            },
            ConditionExpression: "attribute_exists(userId)"
          }));

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
          };

        } catch (dbErr) {
          console.error("Approve item error:", dbErr);
          return { statusCode: 500, headers, body: JSON.stringify({ error: "Ürün durumu güncellenemedi.", details: dbErr.message }) };
        }
      }

      return { statusCode: 400, headers, body: JSON.stringify({ error: "Geçersiz pazar yeri aksiyonu." }) };
    }

    // ── Geleneksel Token Broker İşlemleri ────────────────────────
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
    body = JSON.parse(event.body);
    const { broadcaster_user_id, force_refresh } = body;
    const isForceRefresh = force_refresh === true || force_refresh === 'true';

    if (!broadcaster_user_id) {
      return {
        statusCode: 400, headers, body: JSON.stringify({
          error: "Eksik parametre. (broadcaster_user_id)"
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

    if (!Item.broadcaster_secret) {
      return {
        statusCode: 403, headers, body: JSON.stringify({
          error: "Bu yayıncı için güvenlik anahtarı (broadcaster_secret) tanımlı değil."
        })
      };
    }

    // ── 5. HMAC-SHA256 İMZA DOĞRULAMASI ────────────────────────────
    // İmza = HMAC-SHA256(secret, "userId:timestamp:broadcaster_user_id:force_refresh")
    // Bu sayede secret hiçbir zaman ağ üzerinden açık gönderilmez.
    const expectedPayload = `${userId}:${timestamp}:${broadcaster_user_id}:${isForceRefresh ? 'true' : 'false'}`;
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
    if (Item.broadcaster_user_id &&
      Item.broadcaster_user_id.toString() !== broadcaster_user_id.toString()) {
      console.warn(`Token izolasyonu ihlali: userId=${userId} farklı bir broadcaster_user_id (${broadcaster_user_id}) ile erişim sağlamaya çalıştı.`);
      return {
        statusCode: 403, headers, body: JSON.stringify({
          error: "Bu token başka bir yayıncıya ait."
        })
      };
    }

    // ── 6b. RATE LIMIT KONTROLÜ (last_message_time) ──────────────────
    const lastMessageTime = Item.last_message_time || 0;
    if (now - lastMessageTime < 1) { // 1 saniye rate limit (istek spami önlemek için)
      console.warn(`Rate limit ihlali: userId=${userId} çok hızlı istek gönderdi.`);
      return {
        statusCode: 429, headers, body: JSON.stringify({
          error: "Çok fazla istek. Lütfen en az 1 saniye bekleyin."
        })
      };
    }

    // Son istek zamanını güncelle
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { userId: userId.toString() },
      UpdateExpression: "set last_message_time = :lmt",
      ExpressionAttributeValues: {
        ":lmt": now
      }
    }));

    let activeAccessToken = Item.access_token;

    // ── 7. FORCED REFRESH (401 Alındığında Yenileme) ───────────────
    if (isForceRefresh || !activeAccessToken) {
      console.log(`🔄 Token yenileme tetiklendi: userId=${userId}`);
      if (!Item.refresh_token) {
        return {
          statusCode: 400, headers, body: JSON.stringify({
            error: "Yenileme yapılamaz, refresh_token bulunamadı."
          })
        };
      }

      try {
        const tokenParams = new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: KICK_CLIENT_ID || '',
          client_secret: KICK_CLIENT_SECRET || '',
          refresh_token: Item.refresh_token
        });

        const tokenResponse = await fetch(KICK_TOKEN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: tokenParams.toString()
        });

        if (!tokenResponse.ok) {
          const errText = await tokenResponse.text();
          throw new Error(`Kick API Token Yenileme Hatası (HTTP ${tokenResponse.status}): ${errText}`);
        }

        const tokenData = await tokenResponse.json();
        activeAccessToken = tokenData.access_token;

        // DynamoDB güncelle
        await docClient.send(new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { userId: userId.toString() },
          UpdateExpression: "set access_token = :a, refresh_token = :r, last_updated = :t",
          ExpressionAttributeValues: {
            ":a": tokenData.access_token,
            ":r": tokenData.refresh_token,
            ":t": new Date().toISOString()
          }
        }));

        console.log(`✅ Token başarıyla yenilendi ve DynamoDB güncellendi: userId=${userId}`);

      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        return {
          statusCode: 502, headers, body: JSON.stringify({
            error: "Token yenileme işlemi başarısız oldu.", details: refreshError.message
          })
        };
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        access_token: activeAccessToken
      })
    };

  } catch (error) {
    console.error("Token Vendor Error:", error);
    return {
      statusCode: 500, headers, body: JSON.stringify({
        error: "Sunucu hatası.", details: error.message
      })
    };
  }
};
