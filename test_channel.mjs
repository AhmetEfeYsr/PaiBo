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
        console.log("Channel ID (broadcaster_user_id):", data.id || data.user_id);
        console.log("Chatroom ID:", data.chatroom?.id);
    } catch (e) {
        console.error(e.message);
    }
}
test();
