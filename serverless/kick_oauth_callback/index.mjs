import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const KICK_CLIENT_ID = process.env.KICK_CLIENT_ID;
const KICK_CLIENT_SECRET = process.env.KICK_CLIENT_SECRET;
const KICK_REDIRECT_URI = process.env.KICK_REDIRECT_URI; // Bu Lambda'nın kendi API Gateway URL'si
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "KickUsersTokens";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    try {
        const queryParams = event.queryStringParameters || {};
        const code = queryParams.code;
        const state = queryParams.state; // Örn: "pairaaa|25274829"

        if (!code) {
            return {
                statusCode: 400,
                body: "OAuth yetkilendirme kodu bulunamadı."
            };
        }

        if (!state || !state.includes('|')) {
            return {
                statusCode: 400,
                body: "Geçersiz state parametresi. Kanal adı ve ID eksik."
            };
        }

        const [userId, broadcasterUserId] = state.split('|');

        // 1. Kick API'sine gidip 'code' değerini 'token' ile takas edelim
        const tokenResponse = await fetch("https://id.kick.com/oauth/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                client_id: KICK_CLIENT_ID,
                client_secret: KICK_CLIENT_SECRET,
                code: code,
                redirect_uri: KICK_REDIRECT_URI
            })
        });

        if (!tokenResponse.ok) {
            const err = await tokenResponse.text();
            console.error("Token alınamadı:", err);
            return { statusCode: tokenResponse.status, body: "Kick API'den token alınamadı." };
        }

        const tokenData = await tokenResponse.json();
        
        // 2. Güvenli iletişim için yeni bir gizli anahtar (secret) oluştur
        const broadcasterSecret = randomUUID();

        // 3. Veritabanına kaydet
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                userId: userId,
                broadcaster_user_id: broadcasterUserId,
                broadcaster_secret: broadcasterSecret,
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                last_updated: new Date().toISOString(),
                last_message_time: 0
            }
        }));

        // 4. Kullanıcıyı başarıyla index.html'e geri yönlendir ve secret'ı ona ver
        // Uygulamanızın yayınlandığı adrese yönlendirecek:
        const BASE_URL = "https://atla.pairaaa.com"; 
        
        // Güvenlik: secret'ı hash (#) ile gönderiyoruz ki sunucu loglarına düşmesin, sadece tarayıcı okuyabilsin.
        const redirectUrl = `${BASE_URL}/index.html#success=true&channel=${userId}&buid=${broadcasterUserId}&secret=${broadcasterSecret}`;

        return {
            statusCode: 302, // Yönlendirme (Redirect)
            headers: {
                Location: redirectUrl
            }
        };

    } catch (error) {
        console.error("Callback hatası:", error);
        return {
            statusCode: 500,
            body: "Sunucu hatası oluştu."
        };
    }
};
