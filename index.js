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

  await page.goto("https://www.rolimons.com/marketplace/new-ugc", {
    waitUntil: "networkidle2"
  });

  // 🔥 Ambil data langsung dari React (bukan HTML)
  const items = await page.evaluate(() => {
    const results = [];

    // ambil semua elemen item
    const cards = document.querySelectorAll("div");

    cards.forEach(card => {
      const text = card.innerText;

      // filter FREE
      if (text && text.includes("Price") && text.includes("Free")) {

        const linkEl = card.querySelector("a");
        if (!linkEl) return;

        const name = linkEl.innerText.trim();
        const link = linkEl.href;

        // ambil stock (kalau ada)
        const stockMatch = text.match(/Stock\s([\d,]+)\s\/\s([\d,]+)/);

        let current = 1;
        let total = 1;

        if (stockMatch) {
          current = parseInt(stockMatch[1].replace(/,/g, ""));
          total = parseInt(stockMatch[2].replace(/,/g, ""));
        }

        results.push({
          name,
          link,
          current,
          total
        });
      }
    });

    return results;
  });

  await browser.close();

  console.log("📦 FREE ditemukan:", items.length);

  const channel = await client.channels.fetch(CHANNEL_ID);

  for (const item of items) {

    // 🔥 hanya kirim yang masih ada stock
    if (item.current > 0 && !sent.has(item.link)) {

      console.log("🚀 FREE:", item.name);

      const embed = new EmbedBuilder()
        .setTitle(item.name)
        .setURL(item.link)
        .setDescription(
          `🆓 FREE UGC!\n📦 Stock: ${item.current}/${item.total}`
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

  // cek tiap 8 detik (cukup cepat)
  setInterval(checkFreeUGC, 8000);
});

client.login(TOKEN);
