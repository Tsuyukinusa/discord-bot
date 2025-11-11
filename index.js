// ================================
// 💰 Discord 経済Bot 完全統合版
// ================================
// Author: ChatGPT-5
// Version: Final Integrated Edition
// Node.js v18+ / Discord.js v14+
// ================================

// ===== モジュール読み込み =====
import {
  Client,
  GatewayIntentBits,
  Partials,
  PermissionsBitField,
  EmbedBuilder,
  Collection,
} from "discord.js";
import fs from "fs";
import path from "path";

// ====== クライアント設定 ======
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// ====== TOKEN, CLIENT_ID（GitHub Secrets 推奨） ======
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// ====== 経済データファイル ======
const DATA_PATH = path.resolve("./economyData.json");
if (!fs.existsSync(DATA_PATH))
  fs.writeFileSync(
    DATA_PATH,
    JSON.stringify(
      {
        economyStarted: false,
        currency: { name: "コイン", emoji: "💰" },
        baseMoney: 1000,
        interestRate: 1, // 1% 月
        bank: {},
        stocks: {},
        stockSettings: { changeInterval: 1, changeChannelId: null },
        users: {},
        work: {
          rewardRange: [100, 300],
          messages: [],
          emoji: "💰",
          cooldown: 5, // 分
        },
        crime: {
          rewardRange: [200, 600],
          penaltyRange: [50, 300],
          successRate: 50,
          successMessages: [],
          failMessages: [],
          emoji: "💰",
          cooldown: 10, // 分
        },
        museum: {
          enabled: false,
          rewardPerReaction: 10,
          allowedRoles: [],
          allowedChannels: [],
        },
        loans: [],
        roles: [],
        settings: {
          bankInterest: 1,
          stockInterest: 1,
          stockFluctuationHours: 6,
          stockChannel: null,
        },
      },
      null,
      2
    )
  );

// ====== データ読み込み ======
let db = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
function saveData() {
  fs.writeFileSync(DATA_PATH, JSON.stringify(db, null, 2));
}

// ====== 起動ログ ======
client.once("ready", () => {
  console.log(`✅ ログイン完了: ${client.user.tag}`);
});

// ================================
// 🗣️ 自動返信（ぬさ反応）
// ================================
client.on("messageCreate", (msg) => {
  if (msg.author.bot) return;
  const text = msg.content.toLowerCase();
  if (["ぬさ", "ヌサ", "nusa"].includes(text)) {
    msg.reply("ぬさw");
  }
});

// ================================
// 💵 /balance コマンド
// ================================
client.on("interactionCreate", async (i) => {
  if (!i.isChatInputCommand()) return;
  const cmd = i.commandName;
  const uid = i.user.id;

  if (cmd === "balance") {
    if (!db.users[uid]) db.users[uid] = { money: db.baseMoney, bank: 0, xp: 0, vxp: 0, stocks: {} };
    const u = db.users[uid];
    const e = new EmbedBuilder()
      .setTitle(`${i.user.username} の残高`)
      .setColor("Gold")
      .addFields(
        { name: "💰 所持金", value: `${u.money} ${db.currency.emoji}`, inline: true },
        { name: "🏦 預金", value: `${u.bank} ${db.currency.emoji}`, inline: true },
        { name: "📊 株", value: Object.keys(u.stocks).length + " 社", inline: true }
      )
      .setTimestamp();
    i.reply({ embeds: [e] });
  }
});

// ================================
// 💼 /work & /crime コマンド
// ================================
const cooldowns = new Map();

client.on("interactionCreate", async (i) => {
  if (!i.isChatInputCommand()) return;
  const cmd = i.commandName;
  const uid = i.user.id;

  if (!db.economyStarted) return i.reply("⚠️ 経済システムが開始されていません。");
  if (!db.users[uid]) db.users[uid] = { money: db.baseMoney, bank: 0, xp: 0, vxp: 0, stocks: {} };
  const user = db.users[uid];

  const now = Date.now();
  const cd = cooldowns.get(uid)?.[cmd];
  const diff = cd ? (now - cd) / 60000 : Infinity;

  if (cmd === "work") {
    if (diff < db.work.cooldown)
      return i.reply(`⌛ クールタイム中です。あと ${Math.ceil(db.work.cooldown - diff)}分。`);

    const [min, max] = db.work.rewardRange;
    const gain = Math.floor(Math.random() * (max - min + 1)) + min;
    user.money += gain;
    cooldowns.set(uid, { ...cooldowns.get(uid), work: now });
    saveData();
    return i.reply(`🧰 ${gain}${db.work.emoji || db.currency.emoji} 稼いだ！`);
  }

  if (cmd === "crime") {
    if (diff < db.crime.cooldown)
      return i.reply(`⌛ クールタイム中です。あと ${Math.ceil(db.crime.cooldown - diff)}分。`);

    const success = Math.random() * 100 < db.crime.successRate;
    if (success) {
      const [min, max] = db.crime.rewardRange;
      const gain = Math.floor(Math.random() * (max - min + 1)) + min;
      user.money += gain;
      cooldowns.set(uid, { ...cooldowns.get(uid), crime: now });
      saveData();
      return i.reply(`💵 成功！${gain}${db.crime.emoji || db.currency.emoji} を稼いだ！`);
    } else {
      const [min, max] = db.crime.penaltyRange;
      const loss = Math.floor(Math.random() * (max - min + 1)) + min;
      user.money = Math.max(0, user.money - loss);
      cooldowns.set(uid, { ...cooldowns.get(uid), crime: now });
      saveData();
      return i.reply(`🚨 失敗！罰金 ${loss}${db.crime.emoji || db.currency.emoji} 支払った！`);
    }
  }
});

// ================================
// 📈 株価変動＋配当＋銀行利息＋ロール収入
// ================================
function fluctuateStocks(client) {
  for (const [name, s] of Object.entries(db.stocks)) {
    const old = s.price;
    const rate = (Math.random() - 0.5) * 0.1; // ±5%
    const newPrice = Math.max(1, Math.round(old * (1 + rate)));
    s.price = newPrice;

    const divRate = db.settings.stockInterest / 100;
    for (const [uid, u] of Object.entries(db.users)) {
      if (u.stocks?.[name]) {
        const owned = u.stocks[name];
        const div = Math.floor(owned * divRate);
        u.money += div;
      }
    }

    const ch = db.settings.stockChannel ? client.channels.cache.get(db.settings.stockChannel) : null;
    if (ch)
      ch.send(
        `📊 **${name}** 株価が変動しました！ ${old} → ${newPrice}（${((newPrice - old) / old * 100).toFixed(2)}%）\n💹 配当: ${divRate * 100}%`
      );
  }
  saveData();
}

function applyBankInterest() {
  const rate = db.settings.bankInterest / 100;
  for (const u of Object.values(db.users)) {
    const interest = Math.floor(u.bank * rate);
    u.bank += interest;
  }
  saveData();
}

async function giveRoleIncome(client) {
  for (const guild of client.guilds.cache.values()) {
    for (const r of db.roles) {
      const role = guild.roles.cache.get(r.id);
      if (!role) continue;
      for (const m of role.members.values()) {
        if (!db.users[m.id]) db.users[m.id] = { money: db.baseMoney, bank: 0, xp: 0, vxp: 0, stocks: {} };
        db.users[m.id].money += r.amount;
      }
    }
  }
  saveData();
}

// 定期実行（毎時）
client.on("ready", () => {
  console.log("⏰ 自動経済システム稼働中…");
  setInterval(() => fluctuateStocks(client), 1000 * 60 * 60 * db.settings.stockFluctuationHours);
  setInterval(applyBankInterest, 1000 * 60 * 60 * 24 * 30);
  setInterval(() => giveRoleIncome(client), 1000 * 60 * 60 * 24);
});

// ================================
// 🚀 ログイン
// ================================
client.login(TOKEN);
