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

// ==================================
// ✅ Part2（銀行・株システム）へ続く
// ==================================

client.login(TOKEN);
