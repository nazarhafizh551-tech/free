const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const puppeteer = require('puppeteer');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

let sent = new Set();

async function checkFreeUGC() {
  console.log("🎯 Checking FREE UGC...");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.goto("https://www.rolimons.com/free-roblox-limiteds", {
    waitUntil: "domcontentloaded"
  });

  const items = await page.evaluate(() => {
    const data = [];

    document.querySelectorAll("div").forEach(el => {
      const text = el.innerText;

      if (text && text.includes("Price Free")) {
        const name = el.querySelector("a")?.innerText;
        const link = el.querySelector("a")?.href;

        const stockText = text.match(/Stock\s([\d,]+)\s\/\s([\d,]+)/);

        if (name && link && stockText) {
          const current = parseInt(stockText[1].replace(/,/g, ""));
          const total = parseInt(stockText[2].replace(/,/g, ""));

          data.push({
            name,
            link,
            current,
            total
          });
        }
      }
    });

    return data;
  });

  await browser.close();

  console.log("📦 Total FREE item:", items.length);

  const channel = await client.channels.fetch(CHANNEL_ID);

  for (const item of items) {

    // 🔥 FILTER PENTING
    if (item.current > 0 && !sent.has(item.link)) {

      console.log("🚀 FREE ITEM:", item.name);

      const embed = new EmbedBuilder()
        .setTitle(item.name)
        .setURL(item.link)
        .setDescription(
          `🆓 FREE LIMITED!\n📦 Stock: ${item.current}/${item.total}`
        )
        .setColor(0x00ff00)
        .setTimestamp();

      await channel.send({
        content: "@everyone 🎁 FREE UGC DROP!",
        embeds: [embed]
      });

      sent.add(item.link);
    }
  }

  // limit cache
  if (sent.size > 200) {
    sent = new Set([...sent].slice(-100));
  }
}

client.once("ready", () => {
  console.log(`✅ Bot aktif sebagai ${client.user.tag}`);

  setInterval(checkFreeUGC, 10000); // 10 detik
});

client.login(TOKEN);
