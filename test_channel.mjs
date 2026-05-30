import { gotScraping } from 'got-scraping';

const channel = "pairaaa";
const url = `https://kick.com/api/v2/channels/${channel}`;

async function test() {
    try {
        const response = await gotScraping({
            url: url,
            headerGeneratorOptions: { browsers: [{ name: 'chrome', minVersion: 110 }] },
            responseType: 'json'
        });
        const data = response.body;
        console.log("Keys of body:", Object.keys(data));
        console.log("data.id:", data.id);
        console.log("data.user_id:", data.user_id);
        console.log("data.slug:", data.slug);
        console.log("data.chatroom:", data.chatroom);
    } catch (e) {
        console.error(e.message);
    }
}
test();
