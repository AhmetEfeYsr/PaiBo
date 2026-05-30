/**
 * AWS Lambda: Kick Kanalından Chatroom ID Alma (Cloudflare Bypass)
 * 
 * Bu fonksiyon 'got-scraping' modülünü kullanır. AWS'ye yüklerken
 * node_modules klasörüyle birlikte ZIP'lenmelidir.
 */
import { gotScraping } from 'got-scraping';

export const handler = async (event) => {
  // CORS Başlıkları
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Api-Version'
  };

  // Preflight (OPTIONS) isteğine yanıt ver
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // URL Query parametrelerini al (?channel=xqc)
  const channel = event.queryStringParameters?.channel;

  if (!channel) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Kanal adı (channel) parametresi zorunludur." })
    };
  }

  try {
    // got-scraping ile Cloudflare atlatarak istek at (Tüm kanal verisi)
    const response = await gotScraping({
      url: `https://kick.com/api/v2/channels/${channel}`,
      headerGeneratorOptions: {
        browsers: [{ name: 'chrome', minVersion: 110 }],
        devices: ['desktop'],
        locales: ['en-US'],
        operatingSystems: ['windows']
      },
      responseType: 'json'
    });

    const data = response.body;
    const chatroomId = data?.chatroom?.id;
    const broadcasterUserId = data?.chatroom?.id; // USER REQUEST: chatroom id olacak broadcaster user id değil

    if (!chatroomId || !broadcasterUserId) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: "Chatroom ID alınamadı." }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        channel: channel, 
        chatroom_id: chatroomId,
        broadcaster_user_id: broadcasterUserId 
      })
    };

  } catch (error) {
    console.error("API Error:", error);
    if (error.response && error.response.statusCode === 404) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: "Kanal veya chatroom bulunamadı." }) };
    }
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Sunucu hatası veya Kick API'ye erişilemedi.", details: error.message })
    };
  }
};
