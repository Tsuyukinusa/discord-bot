// ================================
// 📦 Discord 経済Bot統合版 Part1
// ================================
// Discord.js v14 対応
// Node.js v18+ 推奨
// -------------------------------

// ====== 必要モジュール ======
import {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  EmbedBuilder,
  PermissionsBitField,
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

// ====== 環境変数（GitHub Secrets推奨） ======
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// ====== データファイル ======
const DATA_PATH = path.resolve("./economyData.json");

// ====== 初期データ構造 ======
let db = {
  economyStarted: false,
  currency: { name: "コイン", emoji: "💰" },
  baseMoney: 1000,
  interestRate: 1, // 1% 月
  stocks: {},
  stockSettings: { changeInterval: 1, changeChannelId: null },
  bank: {},
  users: {},
  items: {},
  shopSales: {},
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
  adminSettings: {},
};

// ====== データ読み込み ======
if (fs.existsSync(DATA_PATH)) {
  try {
    db = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  } catch (err) {
    console.error("⚠️ データ読み込みエラー:", err);
  }
}

// ====== データ保存関数 ======
function saveData() {
  fs.writeFileSync(DATA_PATH, JSON.stringify(db, null, 2));
}

// ====== ログイン ======
client.once("ready", () => {
  console.log(`✅ ログイン完了: ${client.user.tag}`);
});

// ================================
// ⚙️ 管理者コマンド: 経済設定
// ================================

// 経済をリセット（デフォルト値に戻す）
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  // /reset_economy
  if (commandName === "reset_economy") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: "管理者のみ実行できます。", ephemeral: true });
    }

    db = {
      ...db,
      economyStarted: false,
      users: {},
      items: {},
      shopSales: {},
      loans: [],
    };
    saveData();
    return interaction.reply("💾 経済データをリセットしました。再設定を行ってください。");
  }

  // /set_currency 通貨名と絵文字設定
  if (commandName === "set_currency") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: "管理者のみ実行できます。", ephemeral: true });
    }

    const name = interaction.options.getString("name");
    const emoji = interaction.options.getString("emoji") || "💰";
    db.currency = { name, emoji };
    saveData();
    return interaction.reply(`💱 通貨を設定しました: ${emoji} ${name}`);
  }

  // /start_economy 経済開始
  if (commandName === "start_economy") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: "管理者のみ実行できます。", ephemeral: true });
    }

    db.economyStarted = true;
    saveData();
    return interaction.reply(`🚀 経済システムを開始しました！`);
  }
});

// ================================
// 🧾 経済ステータス確認コマンド
// ================================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, user } = interaction;

  if (commandName === "balance") {
    if (!db.economyStarted) return interaction.reply("⚠️ 経済がまだ開始されていません。");

    if (!db.users[user.id]) {
      db.users[user.id] = { money: db.baseMoney, bank: 0, xp: 0, vxp: 0, stocks: {} };
    }
    const u = db.users[user.id];

    const embed = new EmbedBuilder()
      .setTitle(`${user.username} の残高`)
      .setColor("Gold")
      .addFields(
        { name: "💰 所持金", value: `${u.money} ${db.currency.emoji}`, inline: true },
        { name: "🏦 銀行預金", value: `${u.bank} ${db.currency.emoji}`, inline: true },
        { name: "📊 株式", value: Object.keys(u.stocks).length + " 社", inline: true }
      )
      .setTimestamp();

    saveData();
    return interaction.reply({ embeds: [embed] });
  }
});

//==============================
// 💰 経済・銀行・株・ロール収入システム（時間指定可）
//==============================

const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");
const path = require("path");

const economyFile = path.join(__dirname, "economy.json");
let eco = fs.existsSync(economyFile)
  ? JSON.parse(fs.readFileSync(economyFile))
  : { guilds: {} };

function saveEconomy() {
  fs.writeFileSync(economyFile, JSON.stringify(eco, null, 2));
}

function initGuild(gid) {
  if (!eco.guilds[gid]) {
    eco.guilds[gid] = {
      currency: "円",
      currencyEmoji: "💰",
      interestRate: 1, // 月1%
      stockChannel: null,
      stockInterval: 1, // 時間単位
      stocks: {},
      users: {},
      roleRewards: {}, // roleID: { amount }
      rewardTimes: ["00:00"], // デフォルト 午前0時
    };
  }
  saveEconomy();
}

//==============================
// 🏦 コマンド登録
//==============================
commands.push(
  new SlashCommandBuilder()
    .setName("deposit")
    .setDescription("銀行にお金を預けます")
    .addIntegerOption(o => o.setName("amount").setDescription("預ける金額").setRequired(true)),

  new SlashCommandBuilder()
    .setName("withdraw")
    .setDescription("銀行からお金を引き出します")
    .addIntegerOption(o => o.setName("amount").setDescription("引き出す金額").setRequired(true)),

  new SlashCommandBuilder()
    .setName("create_stock")
    .setDescription("新しい会社を作成します（管理者専用）")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o => o.setName("name").setDescription("会社名").setRequired(true))
    .addIntegerOption(o => o.setName("price").setDescription("初期株価").setRequired(true)),

  new SlashCommandBuilder()
    .setName("buy_stock")
    .setDescription("株を購入します")
    .addStringOption(o => o.setName("name").setDescription("会社名").setRequired(true))
    .addIntegerOption(o => o.setName("amount").setDescription("購入株数").setRequired(true)),

  new SlashCommandBuilder()
    .setName("sell_stock")
    .setDescription("株を売却します")
    .addStringOption(o => o.setName("name").setDescription("会社名").setRequired(true))
    .addIntegerOption(o => o.setName("amount").setDescription("売却株数").setRequired(true)),

  new SlashCommandBuilder()
    .setName("set_currency")
    .setDescription("通貨名と絵文字を設定します（管理者専用）")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o => o.setName("name").setDescription("通貨名").setRequired(true))
    .addStringOption(o => o.setName("emoji").setDescription("通貨絵文字").setRequired(true)),

  new SlashCommandBuilder()
    .setName("set_stock_channel")
    .setDescription("株価変動を通知するチャンネルを設定します（管理者専用）")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(o => o.setName("channel").setDescription("チャンネルを選択").setRequired(true)),

  new SlashCommandBuilder()
    .setName("set_role_reward")
    .setDescription("特定ロールに自動収入を設定します（管理者専用）")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption(o => o.setName("role").setDescription("ロールを選択").setRequired(true))
    .addIntegerOption(o => o.setName("amount").setDescription("付与金額").setRequired(true)),

  new SlashCommandBuilder()
    .setName("set_role_reward_time")
    .setDescription("ロール収入が入る時間を設定します（複数可・管理者専用）")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o =>
      o
        .setName("times")
        .setDescription("時間をカンマ区切りで指定（例: 00:00,08:00,20:00）")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("reset_economy")
    .setDescription("経済システムを初期化します（管理者専用）")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("start_economy")
    .setDescription("経済システムを開始します（管理者専用）")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
);

//==============================
// ⏰ 自動タスク（株価変動＋ロール収入）
//==============================
client.on("ready", async () => {
  console.log("📈 経済システム稼働中...");

  // 株価変動：1時間ごと
  setInterval(async () => {
    for (const [gid, gdata] of Object.entries(eco.guilds)) {
      const guild = client.guilds.cache.get(gid);
      if (!guild) continue;

      for (const [stockName, stock] of Object.entries(gdata.stocks)) {
        const oldPrice = stock.price;
        const rate = (Math.random() - 0.5) * 0.1; // ±5%
        const newPrice = Math.max(1, Math.round(oldPrice * (1 + rate)));
        stock.price = newPrice;

        const dividendRate = gdata.interestRate / 100;
        for (const [uid, user] of Object.entries(gdata.users)) {
          if (user.stocks && user.stocks[stockName]) {
            const owned = user.stocks[stockName];
            const dividend = Math.floor(owned * dividendRate);
            user.stocks[stockName] += dividend;
          }
        }

        if (gdata.stockChannel) {
          const ch = guild.channels.cache.get(gdata.stockChannel);
          if (ch)
            ch.send(
              `📊 **${stockName}** の株価が更新されました！\n` +
                `💴 ${oldPrice} → ${newPrice}（${((newPrice - oldPrice) / oldPrice * 100).toFixed(2)}%）\n` +
                `💹 配当: ${dividendRate * 100}%`
            );
        }
      }

      saveEconomy();
    }
  }, 60 * 60 * 1000);

  // 毎分チェックして指定時刻にロール収入付与
  setInterval(() => {
    const now = new Date();
    const currentTime = now
      .toLocaleTimeString("ja-JP", { hour12: false })
      .slice(0, 5); // "HH:MM"形式

    for (const [gid, gdata] of Object.entries(eco.guilds)) {
      if (gdata.rewardTimes.includes(currentTime)) {
        const guild = client.guilds.cache.get(gid);
        if (!guild) continue;
        for (const [rid, rinfo] of Object.entries(gdata.roleRewards)) {
          const role = guild.roles.cache.get(rid);
          if (!role) continue;
          for (const [uid, member] of role.members) {
            if (!gdata.users[uid])
              gdata.users[uid] = { money: 0, bank: 0, stocks: {} };
            gdata.users[uid].money += rinfo.amount;
          }
        }
        saveEconomy();
        console.log(`💼 ${guild.name} にロール収入付与 (${currentTime})`);
      }
    }
  }, 60 * 1000); // 1分ごとにチェック
});

//==============================
// 💬 コマンド処理
//==============================
client.on("interactionCreate", async i => {
  if (!i.isChatInputCommand()) return;
  const gid = i.guild.id;
  initGuild(gid);
  const g = eco.guilds[gid];
  const uid = i.user.id;
  if (!g.users[uid]) g.users[uid] = { money: 0, bank: 0, stocks: {} };

  // --- 通貨設定 ---
  if (i.commandName === "set_currency") {
    const name = i.options.getString("name");
    const emoji = i.options.getString("emoji");
    g.currency = name;
    g.currencyEmoji = emoji;
    saveEconomy();
    return i.reply(`✅ 通貨を **${emoji}${name}** に設定しました！`);
  }

  // --- 株チャンネル設定 ---
  if (i.commandName === "set_stock_channel") {
    const channel = i.options.getChannel("channel");
    g.stockChannel = channel.id;
    saveEconomy();
    return i.reply(`📢 株価変動チャンネルを <#${channel.id}> に設定しました！`);
  }

  // --- ロール収入設定 ---
  if (i.commandName === "set_role_reward") {
    const role = i.options.getRole("role");
    const amount = i.options.getInteger("amount");
    g.roleRewards[role.id] = { amount };
    saveEconomy();
    return i.reply(
      `💼 ロール「${role.name}」に ${amount}${g.currencyEmoji} の自動収入を設定しました！`
    );
  }

  // --- ロール収入時間設定 ---
  if (i.commandName === "set_role_reward_time") {
    const times = i.options
      .getString("times")
      .split(",")
      .map(t => t.trim())
      .filter(t => /^\d{2}:\d{2}$/.test(t));

    if (!times.length)
      return i.reply("❌ 正しい形式（例: 00:00,08:00,20:00）で入力してください。");

    g.rewardTimes = [...new Set(times)];
    saveEconomy();
    return i.reply(
      `⏰ ロール収入の配布時間を次のように設定しました：\n${times
        .map(t => `🕒 ${t}`)
        .join("\n")}`
    );
  }
});

client.login(TOKEN);
