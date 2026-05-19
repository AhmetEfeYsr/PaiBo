/**
 * Serverless Fonksiyonu: Kick Kanalından Chatroom ID Alma
 * 
 * Bu endpoint, Kick API'sine istek atarak verilen kanal adının
 * chatroom_id (sohbet odası kimliği) değerini 
 * Örnek kullanım:
 * GET /api/kick_channel?channel=xqc
 */

export default async function handler(req, res) {
  // CORS Headers (Tarayıcıdan doğrudan çağrılabilmesi için)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // İstenirse spesifik domain yazılabilir
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // URL Query'den kanal adını al
  const { channel } = req.query;

  if (!channel) {
    return res.status(400).json({ error: "Kanal adı (channel) parametresi zorunludur." });
  }

  try {
    // Kick V2 API'sine istek at
    const response = await fetch(`https://kick.com/api/v2/channels/${channel}`, {
      headers: {
        'Accept': 'application/json',
        // Kick API, tarayıcı taklidi yapan bir user-agent isteyebilir
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: "Kanal bulunamadı." });
      }
      throw new Error(`Kick API Hatası: ${response.status}`);
    }

    const data = await response.json();

    // Sadece chatroom id'yi döndür
    const chatroomId = data?.chatroom?.id;

    if (!chatroomId) {
      return res.status(404).json({ error: "Chatroom ID alınamadı." });
    }

    return res.status(200).json({
      channel: channel,
      chatroom_id: chatroomId
    });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Sunucu hatası veya Kick API'ye erişilemedi.", details: error.message });
  }
}
