//==============================
// 🎯 Discord多機能Bot 完全版
//==============================

// .env の読み込み（TOKEN / CLIENT_ID）
require("dotenv").config();
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// Discord.js を読み込み
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");
const fs = require("fs");
const path = require("path");

//==============================
// ⚙️ クライアント設定
//==============================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates // 🎧 VXP用
  ]
});

client.once("ready", () => {
  console.log(`✅ ログイン完了: ${client.user.tag}`);
});
client.on('messageCreate', message => {
  if (message.content === 'ぬさ') {
    message.channel.send('ぬさ！✨');
  }
});
//==============================
// 💾 データ保存設定
//==============================
const dataFile = path.join(__dirname, "data.json");
let data = fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile)) : {};

function saveData() {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function initGuild(guildId) {
  if (!data[guildId]) {
    data[guildId] = {
      welcomeEnabled: true,
      welcomeMessage: "🎉 ようこそ、{user} さん！サーバーへようこそ！",
      txp: {},
      vxp: {},
      xpRate: 1, // テキスト倍率
      vxpRate: 1, // ボイス倍率（1分ごと）
      excludedRoles: [],
      excludedUsers: [],
      excludedChannels: []
    };
  }
}

//==============================
// 🎉 新メンバーお迎え
//==============================
client.on("guildMemberAdd", (member) => {
  const guildId = member.guild.id;
  initGuild(guildId);
  const guildData = data[guildId];

  if (!guildData.welcomeEnabled) return;

  const channel = member.guild.systemChannel;
  if (!channel) return;

  const msg = guildData.welcomeMessage.replace("{user}", member.user.username);
  channel.send(msg);
});

//==============================
// 💬 テキストXP（TXP）加算
//==============================
client.on("messageCreate", (message) => {
  if (!message.guild || message.author.bot) return;

  const guildId = message.guild.id;
  initGuild(guildId);
  const guildData = data[guildId];

  // 除外チェック
  if (guildData.excludedUsers.includes(message.author.id)) return;
  if (guildData.excludedChannels.includes(message.channel.id)) return;
  if (message.member.roles.cache.some(r => guildData.excludedRoles.includes(r.id))) return;

  // TXP加算
  const userId = message.author.id;
  if (!guildData.txp[userId]) guildData.txp[userId] = 0;
  guildData.txp[userId] += guildData.xpRate;
  saveData();
});

//==============================
// 🔊 ボイスXP（VXP）加算
//==============================
const voiceTimes = new Map();

client.on("voiceStateUpdate", (oldState, newState) => {
  const member = newState.member;
  if (!member || member.user.bot) return;

  const guildId = member.guild.id;
  initGuild(guildId);
  const guildData = data[guildId];

  if (newState.channelId && !oldState.channelId) {
    // ボイスに参加
    voiceTimes.set(member.id, Date.now());
  } else if (!newState.channelId && oldState.channelId) {
    // ボイスから退出
    const start = voiceTimes.get(member.id);
    if (!start) return;

    const minutes = Math.floor((Date.now() - start) / 60000);
    voiceTimes.delete(member.id);

    if (minutes > 0) {
      if (!guildData.vxp[member.id]) guildData.vxp[member.id] = 0;
      guildData.vxp[member.id] += minutes * guildData.vxpRate;
      saveData();
    }
  }
});

//==============================
// ⚙️ スラッシュコマンド定義
//==============================
const commands = [
  new SlashCommandBuilder()
    .setName("rank")
    .setDescription("自分のTXPとVXPを確認します。"),

  new SlashCommandBuilder()
    .setName("rankings")
    .setDescription("TXPまたはVXPのランキングを表示します。")
    .addStringOption(option =>
      option
        .setName("type")
        .setDescription("txp または vxp を選択")
        .setRequired(true)
        .addChoices(
          { name: "TXP（テキスト）", value: "txp" },
          { name: "VXP（ボイス）", value: "vxp" }
        )
    ),

  new SlashCommandBuilder()
    .setName("setxp")
    .setDescription("テキストXP倍率を設定します。")
    .addNumberOption(option =>
      option
        .setName("rate")
        .setDescription("倍率を入力（例：1.5）")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("setvxp")
    .setDescription("ボイスXP倍率を設定します（1分あたり）。")
    .addNumberOption(option =>
      option
        .setName("rate")
        .setDescription("倍率を入力（例：2）")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("excluderole")
    .setDescription("XP集計から除外するロールを設定します。")
    .addRoleOption(option =>
      option
        .setName("role")
        .setDescription("除外するロール")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("excludeuser")
    .setDescription("XP集計から除外するユーザーを設定します。")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("除外するユーザー")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("excludechannel")
    .setDescription("XP集計から除外するチャンネルを設定します。")
    .addChannelOption(option =>
      option
        .setName("channel")
        .setDescription("除外するチャンネル")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("お迎えメッセージ機能をON/OFFします。")
    .addStringOption(option =>
      option
        .setName("mode")
        .setDescription("on/off")
        .setRequired(true)
        .addChoices(
          { name: "on", value: "on" },
          { name: "off", value: "off" }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("setwelcome")
    .setDescription("お迎えメッセージを設定します。")
    .addStringOption(option =>
      option
        .setName("message")
        .setDescription("お迎えメッセージ内容（{user}でユーザー名）")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(cmd => cmd.toJSON());

//==============================
// 🚀 スラッシュコマンド登録
//==============================
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("⏳ スラッシュコマンド登録中...");
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("✅ スラッシュコマンド登録完了！");
  } catch (error) {
    console.error(error);
  }
})();

//==============================
// 🎮 コマンド処理
//==============================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const guildId = interaction.guild.id;
  initGuild(guildId);
  const guildData = data[guildId];

  // /rank
  if (interaction.commandName === "rank") {
    const userId = interaction.user.id;
    const txp = guildData.txp[userId] || 0;
    const vxp = guildData.vxp[userId] || 0;
    return interaction.reply(`📊 ${interaction.user.username}さんのランク\n📝 TXP: ${txp}\n🎧 VXP: ${vxp}`);
  }

  // /rankings
  if (interaction.commandName === "rankings") {
    const type = interaction.options.getString("type");
    const xpData = guildData[type];
    if (!xpData || Object.keys(xpData).length === 0)
      return interaction.reply("📉 データがまだありません。");

    const sorted = Object.entries(xpData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const result = sorted
      .map(([id, xp], i) => `**${i + 1}.** <@${id}> — ${xp} XP`)
      .join("\n");

    return interaction.reply(`🏆 **${type.toUpperCase()} ランキングTOP10**\n${result}`);
  }

  // /setxp
  if (interaction.commandName === "setxp") {
    const rate = interaction.options.getNumber("rate");
    guildData.xpRate = rate;
    saveData();
    return interaction.reply(`🧮 テキストXP倍率を **${rate}** に設定しました！`);
  }

  // /setvxp
  if (interaction.commandName === "setvxp") {
    const rate = interaction.options.getNumber("rate");
    guildData.vxpRate = rate;
    saveData();
    return interaction.reply(`🎧 ボイスXP倍率を **${rate}** に設定しました！（1分あたり）`);
  }

  // /welcome
  if (interaction.commandName === "welcome") {
    const mode = interaction.options.getString("mode");
    guildData.welcomeEnabled = mode === "on";
    saveData();
    return interaction.reply(`🔧 お迎えメッセージを **${mode.toUpperCase()}** にしました！`);
  }

  // /setwelcome
  if (interaction.commandName === "setwelcome") {
    const message = interaction.options.getString("message");
    guildData.welcomeMessage = message;
    saveData();
    return interaction.reply(`✏️ お迎えメッセージを変更しました！\n現在の設定：\n> ${message}`);
  }

  // 除外コマンド類
  if (interaction.commandName === "excluderole") {
    const role = interaction.options.getRole("role");
    if (!guildData.excludedRoles.includes(role.id)) guildData.excludedRoles.push(role.id);
    saveData();
    return interaction.reply(`🚫 ロール **${role.name}** をXP除外に設定しました。`);
  }

  if (interaction.commandName === "excludeuser") {
    const user = interaction.options.getUser("user");
    if (!guildData.excludedUsers.includes(user.id)) guildData.excludedUsers.push(user.id);
    saveData();
    return interaction.reply(`🚫 ユーザー **${user.username}** をXP除外に設定しました。`);
  }

  if (interaction.commandName === "excludechannel") {
    const channel = interaction.options.getChannel("channel");
    if (!guildData.excludedChannels.includes(channel.id)) guildData.excludedChannels.push(channel.id);
    saveData();
    return interaction.reply(`🚫 チャンネル **${channel.name}** をXP除外に設定しました。`);
  }
});

// index.js — Discord 多機能 XP/レベル Bot 完全統合版
// 前提: GitHub Secrets に TOKEN と CLIENT_ID が登録済み

const fs = require("fs");
const path = require("path");
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

// ===== 設定（環境変数は GitHub Secrets から） =====
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const DATA_FILE = path.join(__dirname, "data.json");

// ===== データ読み込み/保存 =====
let data = {};
if (fs.existsSync(DATA_FILE)) {
  try { data = JSON.parse(fs.readFileSync(DATA_FILE)); } catch (e) { data = {}; }
}
function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
function initGuild(guildId) {
  if (!data[guildId]) {
    data[guildId] = {
      // ウェルカム
      welcomeEnabled: true,
      welcomeMessage: "🎉 ようこそ、{user} さん！サーバーへようこそ！",
      // XP
      txp: {}, // { userId: xp }
      vxp: {},
      levels: {}, // { userId: level }
      // レート / 必要XP
      txpRate: 1,   // 1メッセージあたりのTXP量（管理者が変更可）
      vxpRate: 1,   // 1分あたりのVXP量（管理者が変更可）
      xpToLevel: 100, // 1レベルに必要なXP（管理者が変更可）
      // 除外設定
      excludedUsers: [], // userIds
      excludedRoles: [], // roleIds
      excludedChannels: [], // channelIds
      // レベル→ロール設定
      levelRoles: {}, // { "5": "roleId", "10": "roleId2" }
      // レベルアップ通知メッセージ
      levelUpMessage: "🎉 {user} さんがレベル {level} にアップしました！✨"
    };
  }
}

// ===== クライアント作成 =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// ===== voice 入退室時の計測用 =====
const voiceTimes = new Map(); // memberId -> enterTimestamp(ms)

// ===== ヘルパー: 合計XP取得 =====
function getTotalXP(guildData, userId) {
  return (guildData.txp[userId] || 0) + (guildData.vxp[userId] || 0);
}

// ===== レベルアップ判定・処理 =====
async function checkLevelUp(member, guildId, guildData) {
  if (!member || !member.id) return;
  const userId = member.id;
  const totalXP = getTotalXP(guildData, userId);
  const prevLevel = guildData.levels[userId] || 0;
  const newLevel = Math.floor(totalXP / guildData.xpToLevel);

  if (newLevel > prevLevel) {
    // 複数レベル上がる可能性があるので繰り返す
    for (let lvl = prevLevel + 1; lvl <= newLevel; lvl++) {
      guildData.levels[userId] = lvl;
      saveData();

      // 通知メッセージ（{user} と {level} を置換）
      const text = guildData.levelUpMessage
        .replace(/\{user\}/g, member.user.username)
        .replace(/\{level\}/g, String(lvl));
      const sysCh = member.guild.systemChannel;
      if (sysCh) sysCh.send(text).catch(() => {});

      // ロール付与（そのレベルに設定があれば付与）
      const roleId = guildData.levelRoles[String(lvl)];
      if (roleId) {
        const role = member.guild.roles.cache.get(roleId);
        if (role) {
          member.roles.add(role).catch(() => {});
        }
      }
    }
  }
}

// ===== 起動ログ =====
client.once("ready", () => {
  console.log(`✅ ログイン完了: ${client.user.tag}`);
});

// ===== ぬさ応答 + テキストXP集計 (1つの messageCreate で処理) =====
client.on("messageCreate", async (message) => {
  if (!message.guild || message.author.bot) return;

  // 「ぬさ」に反応（部分一致でも可。完全一致にしたければ ===）
  if (message.content === "ぬさ") {
    message.channel.send("ぬさ！✨").catch(() => {});
  }

  const guildId = message.guild.id;
  initGuild(guildId);
  const guildData = data[guildId];

  // 除外チェック
  if (guildData.excludedUsers.includes(message.author.id)) return;
  if (guildData.excludedChannels.includes(message.channel.id)) return;
  if (message.member && message.member.roles && message.member.roles.cache.some(r => guildData.excludedRoles.includes(r.id))) return;

  // TXP 加算
  const uid = message.author.id;
  guildData.txp[uid] = (guildData.txp[uid] || 0) + guildData.txpRate;
  saveData();

  // レベル判定
  await checkLevelUp(message.member, guildId, guildData);
});

// ===== ボイス滞在時間をVXPに変換 =====
client.on("voiceStateUpdate", async (oldState, newState) => {
  const member = newState.member || oldState.member;
  if (!member || member.user.bot) return;
  const guildId = member.guild.id;
  initGuild(guildId);
  const guildData = data[guildId];

  // 除外チェック（ユーザー、ロール）
  if (guildData.excludedUsers.includes(member.id)) return;
  if (member.roles && member.roles.cache.some(r => guildData.excludedRoles.includes(r.id))) return;

  // 入室
  if (!oldState.channelId && newState.channelId) {
    voiceTimes.set(member.id, Date.now());
    return;
  }

  // 退室
  if (oldState.channelId && !newState.channelId) {
    const start = voiceTimes.get(member.id);
    voiceTimes.delete(member.id);
    if (!start) return;

    const minutes = Math.floor((Date.now() - start) / 60000);
    if (minutes <= 0) return;

    // VXP 加算（minutes * vxpRate）
    guildData.vxp[member.id] = (guildData.vxp[member.id] || 0) + minutes * guildData.vxpRate;
    saveData();

    // レベル判定
    await checkLevelUp(member, guildId, guildData);
  }
});

// ===== スラッシュコマンド定義（すべてサーバー単位で登録） =====
const commands = [
  // 自分のステータス
  new SlashCommandBuilder().setName("rank").setDescription("自分のTXPとVXPとレベルを確認します。").toJSON(),

  // ランキング
  new SlashCommandBuilder()
    .setName("rankings")
    .setDescription("TXPまたはVXPのランキングを表示します。")
    .addStringOption(opt => opt.setName("type").setDescription("txp または vxp").setRequired(true)
      .addChoices({ name: "TXP（テキスト）", value: "txp" }, { name: "VXP（ボイス）", value: "vxp" }))
    .toJSON(),

  // TXP/VXP レート設定 (管理者)
  new SlashCommandBuilder()
    .setName("setxp")
    .setDescription("テキストXPの1メッセージあたりの量を設定します。")
    .addNumberOption(opt => opt.setName("rate").setDescription("例: 1.5").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),

  new SlashCommandBuilder()
    .setName("setvxp")
    .setDescription("ボイスXPの1分あたりの量を設定します。")
    .addNumberOption(opt => opt.setName("rate").setDescription("例: 2").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),

  // 除外設定 (管理者)
  new SlashCommandBuilder()
    .setName("excluderole")
    .setDescription("XP集計から除外するロールを追加します。")
    .addRoleOption(opt => opt.setName("role").setDescription("除外するロール").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),

  new SlashCommandBuilder()
    .setName("excludeuser")
    .setDescription("XP集計から除外するユーザーを追加します。")
    .addUserOption(opt => opt.setName("user").setDescription("除外するユーザー").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),

  new SlashCommandBuilder()
    .setName("excludechannel")
    .setDescription("XP集計から除外するチャンネルを追加します。")
    .addChannelOption(opt => opt.setName("channel").setDescription("除外するチャンネル").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),

  // ウェルカム設定
  new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("お迎えメッセージ機能のON/OFFを切り替えます。")
    .addStringOption(opt => opt.setName("mode").setDescription("on / off").setRequired(true)
      .addChoices({ name: "on", value: "on" }, { name: "off", value: "off" }))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),

  new SlashCommandBuilder()
    .setName("setwelcome")
    .setDescription("お迎えメッセージを設定します（{user}でユーザー名）。")
    .addStringOption(opt => opt.setName("message").setDescription("メッセージ本文").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),

  // レベル関連（管理者）
  new SlashCommandBuilder()
    .setName("setlevelrole")
    .setDescription("特定レベルに達したら付与するロールを設定します。")
    .addIntegerOption(opt => opt.setName("level").setDescription("レベル").setRequired(true))
    .addRoleOption(opt => opt.setName("role").setDescription("付与するロール").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),

  new SlashCommandBuilder()
    .setName("setlevelmsg")
    .setDescription("レベルアップ通知メッセージを設定します（{user} と {level} を使えます）。")
    .addStringOption(opt => opt.setName("message").setDescription("例: 🎉 {user} が Lv{level} に！").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),

  new SlashCommandBuilder()
    .setName("setlevelxp")
    .setDescription("1レベルあたりの必要XPを設定します。")
    .addIntegerOption(opt => opt.setName("xp").setDescription("例: 100").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON()
];

// ===== 登録（アプリケーションコマンド） =====
const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => {
  try {
    console.log("⏳ スラッシュコマンド登録中...");
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("✅ スラッシュコマンド登録完了！");
  } catch (err) {
    console.error("コマンド登録エラー:", err);
  }
})();

// ===== スラッシュコマンド処理 =====
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const guildId = interaction.guild.id;
  initGuild(guildId);
  const guildData = data[guildId];

  try {
    switch (interaction.commandName) {
      // ===== ユーザー向け =====
      case "rank": {
        const id = interaction.user.id;
        const txp = guildData.txp[id] || 0;
        const vxp = guildData.vxp[id] || 0;
        const lvl = guildData.levels[id] || 0;
        return interaction.reply({ content: `📊 ${interaction.user.username} さん\n📝 TXP: ${txp}\n🎧 VXP: ${vxp}\n🏅 レベル: ${lvl}`, ephemeral: true });
      }

      case "rankings": {
        const type = interaction.options.getString("type");
        const xpData = guildData[type];
        if (!xpData || Object.keys(xpData).length === 0) return interaction.reply({ content: "📉 データがありません。", ephemeral: true });

        const sorted = Object.entries(xpData).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const result = sorted.map(([id, xp], i) => `**${i + 1}.** <@${id}> — ${xp} XP`).join("\n");
        return interaction.reply({ content: `🏆 **${type.toUpperCase()} ランキングTOP10**\n${result}` });
      }

      // ===== 管理者向け =====
      case "setxp": {
        const rate = interaction.options.getNumber("rate");
        guildData.txpRate = rate;
        saveData();
        return interaction.reply({ content: `🧮 テキストXPの倍率を **${rate}** に設定しました。`, ephemeral: true });
      }

      case "setvxp": {
        const rate = interaction.options.getNumber("rate");
        guildData.vxpRate = rate;
        saveData();
        return interaction.reply({ content: `🎧 ボイスXPの倍率を **${rate}** に設定しました。（1分あたり）`, ephemeral: true });
      }

      case "excluderole": {
        const role = interaction.options.getRole("role");
        if (!guildData.excludedRoles.includes(role.id)) guildData.excludedRoles.push(role.id);
        saveData();
        return interaction.reply({ content: `🚫 ロール **${role.name}** をXP除外に追加しました。`, ephemeral: true });
      }

      case "excludeuser": {
        const user = interaction.options.getUser("user");
        if (!guildData.excludedUsers.includes(user.id)) guildData.excludedUsers.push(user.id);
        saveData();
        return interaction.reply({ content: `🚫 ユーザー **${user.username}** をXP除外に追加しました。`, ephemeral: true });
      }

      case "excludechannel": {
        const ch = interaction.options.getChannel("channel");
        if (!guildData.excludedChannels.includes(ch.id)) guildData.excludedChannels.push(ch.id);
        saveData();
        return interaction.reply({ content: `🚫 チャンネル **${ch.name}** をXP除外に追加しました。`, ephemeral: true });
      }

      case "welcome": {
        const mode = interaction.options.getString("mode");
        guildData.welcomeEnabled = (mode === "on");
        saveData();
        return interaction.reply({ content: `🔧 お迎えメッセージを **${mode}** にしました。`, ephemeral: true });
      }

      case "setwelcome": {
        const msg = interaction.options.getString("message");
        guildData.welcomeMessage = msg;
        saveData();
        return interaction.reply({ content: `✏️ お迎えメッセージを更新しました。\n> ${msg}`, ephemeral: true });
      }

      case "setlevelrole": {
        const level = interaction.options.getInteger("level");
        const role = interaction.options.getRole("role");
        guildData.levelRoles[String(level)] = role.id;
        saveData();
        return interaction.reply({ content: `🎯 Lv${level} 到達で **${role.name}** を付与するよう設定しました。`, ephemeral: true });
      }

      case "setlevelmsg": {
        const msg = interaction.options.getString("message");
        guildData.levelUpMessage = msg;
        saveData();
        return interaction.reply({ content: `✏️ レベルアップ通知を更新しました。\n> ${msg}`, ephemeral: true });
      }

      case "setlevelxp": {
        const xp = interaction.options.getInteger("xp");
        guildData.xpToLevel = xp;
        saveData();
        return interaction.reply({ content: `⚙️ 1レベルあたりの必要XPを **${xp}** に設定しました。`, ephemeral: true });
      }

      default:
        return interaction.reply({ content: "未実装のコマンドです。", ephemeral: true });
    }
  } catch (err) {
    console.error("コマンド処理エラー:", err);
    return interaction.reply({ content: "エラーが発生しました。", ephemeral: true });
  }
});

// ===== 最後にログイン =====
client.login(TOKEN);
