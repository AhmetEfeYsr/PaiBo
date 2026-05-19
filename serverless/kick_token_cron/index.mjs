/**
 * AWS Lambda Cron Job: Kick OAuth Token Yenileme (Batch Processing)
 * 
 * Bu fonksiyon, AWS EventBridge ile belirli aralıklarla (örn: 2 saatte bir) tetiklenir.
 * Suistimali ve rate-limit'i önlemek için DynamoDB'den her defasında
 * 100 kişilik bir küme (batch) çeker ve sadece onların tokenlarını yeniler.
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const KICK_CLIENT_ID = process.env.KICK_CLIENT_ID;
const KICK_CLIENT_SECRET = process.env.KICK_CLIENT_SECRET;
const KICK_TOKEN_URL = "https://id.kick.com/oauth/token"; // DOKÜMANA GÖRE GÜNCELLENDİ
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "KickUsersTokens";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    console.log("🔄 Batch Token yenileme işlemi başlatıldı...");

    // 1. DynamoDB'den yenilenmesi gereken 100 kullanıcıyı çek
    // Gerçek bir senaryoda "GSI (Global Secondary Index)" kullanarak 
    // "sonYenilenmeZamani" en eski olan 100 kişiyi Query ile çekmek en doğrusudur.
    // Şimdilik basit bir Scan + Limit kullanıyoruz.
    const scanParams = {
      TableName: TABLE_NAME,
      Limit: 100
    };
    
    const { Items } = await docClient.send(new ScanCommand(scanParams));

    if (!Items || Items.length === 0) {
      console.log("Yenilenecek kullanıcı bulunamadı.");
      return { statusCode: 200, body: "İşlem yapılacak kullanıcı yok." };
    }

    console.log(`${Items.length} yayıncı için token yenileme başlıyor...`);

    let basarili = 0;
    let basarisiz = 0;

    // 2. Her kullanıcı için token yenileme isteği at (Rate limit için sırayla)
    for (const user of Items) {
      if (!user.refresh_token) continue;

      try {
        const params = new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: KICK_CLIENT_ID,
          client_secret: KICK_CLIENT_SECRET,
          refresh_token: user.refresh_token
        });

        const response = await fetch(KICK_TOKEN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: params.toString()
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const tokenData = await response.json();

        // 3. Yeni tokenları DynamoDB'ye kaydet
        await docClient.send(new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { userId: user.userId }, // Tablonuzun Primary Key'i 'userId' olmalı
          UpdateExpression: "set access_token = :a, refresh_token = :r, last_updated = :t",
          ExpressionAttributeValues: {
            ":a": tokenData.access_token,
            ":r": tokenData.refresh_token,
            ":t": new Date().toISOString()
          }
        }));

        basarili++;
        // Kick API Rate Limit'ine takılmamak için araya ufak bir bekleme (50ms) koyabiliriz.
        await new Promise(res => setTimeout(res, 50));

      } catch (err) {
        console.error(`Kullanıcı ${user.userId} için token yenilenemedi:`, err.message);
        basarisiz++;
      }
    }

    console.log(`✅ İşlem tamamlandı. Başarılı: ${basarili}, Başarısız: ${basarisiz}`);
    return { statusCode: 200, body: JSON.stringify({ basarili, basarisiz }) };

  } catch (error) {
    console.error("Cron Job Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Batch yenileme hatası", details: error.message }) };
  }
};
