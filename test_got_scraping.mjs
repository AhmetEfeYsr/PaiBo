// test_got_scraping.js
import { gotScraping } from 'got-scraping';

const channel = "pairaaa";
const url = `https://kick.com/api/v2/channels/${channel}/chatroom`;

async function test() {
    console.log(`📡 İstek atılıyor: ${url}`);
    try {
        const response = await gotScraping({
            url: url,
            headerGeneratorOptions: {
                browsers: [{ name: 'chrome', minVersion: 110 }],
                devices: ['desktop'],
                locales: ['en-US'],
                operatingSystems: ['windows']
            }
        });

        console.log(`HTTP Status: ${response.statusCode}`);
        console.log("✅ Başarılı! Gelen Veri:");
        console.log(response.body);

    } catch (error) {
        console.error("❌ İstek sırasında hata oluştu:");
        if (error.response) {
            console.error(`Status: ${error.response.statusCode}`);
            console.error(error.response.body.substring(0, 200));
        } else {
            console.error(error.message);
        }
    }
}

test();
