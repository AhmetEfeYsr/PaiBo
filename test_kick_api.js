// test_kick_api.js
// Kick API'sinden chatroom id çekmeyi lokalde test etmek için script

const channel = "pairaaa";
// Yeni endpoint: https://kick.com/api/v2/channels/{channel}/chatroom
const url = `https://kick.com/api/v2/channels/${channel}/chatroom`;

async function testKickApi() {
    console.log(`📡 İstek atılıyor: ${url}`);
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
                'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin'
            }
        });

        console.log(`HTTP Status: ${response.status}`);
        
        if (!response.ok) {
            console.error("❌ Hata! Cloudflare takılmış olabilir.");
            const text = await response.text();
            console.log("Yanıt Özeti:", text.substring(0, 200));
            return;
        }

        const data = await response.json();
        console.log("✅ Başarılı! Gelen Veri:");
        console.log(JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("❌ İstek sırasında hata oluştu:", error);
    }
}

testKickApi();
