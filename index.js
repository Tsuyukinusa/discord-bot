

client.on('messageCreate', message => {
  if (message.content === 'ぬさ') {
    message.channel.send('ぬさ！✨');
  }
});

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

//==============================
// 🔑 最後にログイン
//==============================
client.login(TOKEN);
