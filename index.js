require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const URL = "https://www.rolimons.com/free-roblox-limiteds";

let sentItems = new Set();

async function checkUGC() {
  try {
    const { data } = await axios.get(URL);
    const $ = cheerio.load(data);

    $(".ugc-item, .item").each((i, el) => {
      const name = $(el).find(".item-name").text().trim();
      const link = "https://www.rolimons.com" + $(el).find("a").attr("href");
      const img = $(el).find("img").attr("src");

      if (!name) return;

      if (!sentItems.has(name)) {
        sentItems.add(name);

        const embed = new EmbedBuilder()
          .setTitle("🎁 FREE UGC FOUND!")
          .setDescription(`**${name}**\n[Claim disini](${link})`)
          .setImage(img)
          .setColor("Green")
          .setFooter({ text: "Rolimons Free UGC" })
          .setTimestamp();

        const channel = client.channels.cache.get(process.env.CHANNEL_ID);
        if (channel) {
          channel.send({
            content: "@everyone 🚨 FREE ITEM!",
            embeds: [embed]
          });
        }
      }
    });

  } catch (err) {
    console.log("Error:", err.message);
  }
}

client.once("ready", () => {
  console.log(`✅ Bot login sebagai ${client.user.tag}`);

  checkUGC();
  setInterval(checkUGC, 15000); // cek tiap 15 detik
});

client.login(process.env.TOKEN);
