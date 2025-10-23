require("dotenv").config(); // ← これを一番上に！
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates // ← VXPを測定するために追加！
  ]
});

client.once("ready", () => {
  console.log(`✅ ログイン完了: ${client.user.tag}`);
});

client.login(TOKEN); // ← GitHub SecretsのTOKENを使ってログイン

client.on('messageCreate', message => {
  if (message.content === 'ぬさ') {
    message.channel.send('ぬさ！✨');
  }
});

const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// データ保存ファイル（サーバーごと設定を保存）
const dataFile = path.join(__dirname, "data.json");
let data = fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile)) : {};

// デフォルト設定
const DEFAULT_WELCOME_MESSAGE = "🎉 ようこそ、{user} さん！サーバーへようこそ！";
const DEFAULT_WELCOME_ENABLED = true;

// 🪄 新メンバーお迎えイベント
client.on("guildMemberAdd", async (member) => {
  const guildId = member.guild.id;
  const guildData = data[guildId] || { welcomeEnabled: DEFAULT_WELCOME_ENABLED, welcomeMessage: DEFAULT_WELCOME_MESSAGE };

  if (guildData.welcomeEnabled) {
    const channel = member.guild.systemChannel;
    if (channel) {
      const msg = guildData.welcomeMessage.replace("{user}", member.user.username);
      channel.send(msg);
    }
  }
});

// 🧩 スラッシュコマンド定義（rankは誰でも、welcomeとsetwelcomeは管理者限定）
const commands = [
  new SlashCommandBuilder()
    .setName("rank")
    .setDescription("自分のメッセージランクを確認します。"),

  new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("お迎えメッセージ機能をON/OFFします。")
    .addStringOption(option =>
      option
        .setName("mode")
        .setDescription("お迎えを on/off にします。")
        .setRequired(true)
        .addChoices(
          { name: "on", value: "on" },
          { name: "off", value: "off" }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // 管理者限定

  new SlashCommandBuilder()
    .setName("setwelcome")
    .setDescription("お迎えメッセージを設定します。")
    .addStringOption(option =>
      option
        .setName("message")
        .setDescription("お迎えメッセージ内容（{user} を入れるとユーザー名が入ります）")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // 管理者限定
].map(cmd => cmd.toJSON());

// 🪄 スラッシュコマンドをDiscordに登録
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
(async () => {
  try {
    console.log("⏳ スラッシュコマンド登録中...");
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log("✅ スラッシュコマンド登録完了！");
  } catch (error) {
    console.error(error);
  }
})();

// 🧮 メッセージ数カウント（rank用）
client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  const guildId = message.guild.id;
  const userId = message.author.id;

  if (!data[guildId]) data[guildId] = { xp: {}, welcomeEnabled: DEFAULT_WELCOME_ENABLED, welcomeMessage: DEFAULT_WELCOME_MESSAGE };
  if (!data[guildId].xp[userId]) data[guildId].xp[userId] = 0;
  data[guildId].xp[userId] += 1;

  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
});

// 💬 スラッシュコマンドの実行処理
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const guildId = interaction.guild.id;
  const userId = interaction.user.id;
  if (!data[guildId]) data[guildId] = { xp: {}, welcomeEnabled: DEFAULT_WELCOME_ENABLED, welcomeMessage: DEFAULT_WELCOME_MESSAGE };

  // /rank
  if (interaction.commandName === "rank") {
    const xp = data[guildId].xp[userId] || 0;
    await interaction.reply(`📊 ${interaction.user.username}さんのメッセージ数は **${xp}** です！`);
  }

  // /welcome（ON/OFF）
  if (interaction.commandName === "welcome") {
    const mode = interaction.options.getString("mode");
    data[guildId].welcomeEnabled = mode === "on";
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    await interaction.reply(`🔧 お迎えメッセージを **${mode.toUpperCase()}** にしました！`);
  }

  // /setwelcome（メッセージ変更）
  if (interaction.commandName === "setwelcome") {
    const message = interaction.options.getString("message");
    data[guildId].welcomeMessage = message;
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    await interaction.reply(`✏️ お迎えメッセージを変更しました！\n現在の設定：\n> ${message}`);
  }
  
  client.on("messageCreate", (message) => { ... });
client.on("interactionCreate", async (interaction) => { ... });
//-------------------------------------------------------
// 🪄 ランク・XP管理機能
//-------------------------------------------------------
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

// ギルドデータの初期値
function initGuild(guildId) {
  if (!data[guildId]) {
    data[guildId] = {
      welcomeEnabled: true,
      welcomeMessage: "🎉 ようこそ、{user} さん！サーバーへようこそ！",
      txp: {}, // テキストXP
      vxp: {}, // ボイスXP
      xpRate: 1, // テキストXP倍率
      vxpRate: 1, // ボイスXP 1分あたり倍率
      excludedRoles: [], // 除外ロール
      excludedUsers: [], // 除外ユーザー
      excludedChannels: [] // 除外チャンネル
    };
  }
}
const saveData = () => fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

//-------------------------------------------------------
// 💬 テキストXP加算
//-------------------------------------------------------
client.on("messageCreate", (message) => {
  if (message.author.bot || !message.guild) return;
  const guildId = message.guild.id;
  initGuild(guildId);

  const guildData = data[guildId];
  const userId = message.author.id;

  // 除外ユーザー・ロール・チャンネルチェック
  if (guildData.excludedUsers.includes(userId)) return;
  if (guildData.excludedChannels.includes(message.channel.id)) return;
  if (message.member.roles.cache.some(r => guildData.excludedRoles.includes(r.id))) return;

  // XP加算
  if (!guildData.txp[userId]) guildData.txp[userId] = 0;
  guildData.txp[userId] += guildData.xpRate;

  saveData();
});

//-------------------------------------------------------
// 🔊 ボイスチャットXP加算（1分ごと）
//-------------------------------------------------------
const voiceTimes = new Map();

client.on("voiceStateUpdate", (oldState, newState) => {
  const member = newState.member;
  if (!member || member.user.bot) return;
  const guildId = member.guild.id;
  initGuild(guildId);
  const guildData = data[guildId];

  if (newState.channelId && !oldState.channelId) {
    // ボイスに入った時
    voiceTimes.set(member.id, Date.now());
  } else if (!newState.channelId && oldState.channelId) {
    // ボイスから抜けた時
    const start = voiceTimes.get(member.id);
    if (!start) return;
    const duration = Math.floor((Date.now() - start) / 60000); // 分
    voiceTimes.delete(member.id);

    if (duration > 0) {
      if (!guildData.vxp[member.id]) guildData.vxp[member.id] = 0;
      guildData.vxp[member.id] += duration * guildData.vxpRate;
      saveData();
    }
  }
});

//-------------------------------------------------------
// ⚙️ 管理者専用コマンド：設定
//-------------------------------------------------------
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const guildId = interaction.guild.id;
  initGuild(guildId);
  const guildData = data[guildId];

  //---------------------------------------------------
  // /setxp テキストXP倍率変更
  //---------------------------------------------------
  if (interaction.commandName === "setxp") {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
      return interaction.reply({ content: "⚠️ 管理者のみが使用できます。", ephemeral: true });

    const rate = interaction.options.getNumber("rate");
    guildData.xpRate = rate;
    saveData();
    return interaction.reply(`🧮 テキストXP倍率を **${rate}** に設定しました！`);
  }

  //---------------------------------------------------
  // /setvxp ボイスXP倍率変更
  //---------------------------------------------------
  if (interaction.commandName === "setvxp") {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
      return interaction.reply({ content: "⚠️ 管理者のみが使用できます。", ephemeral: true });

    const rate = interaction.options.getNumber("rate");
    guildData.vxpRate = rate;
    saveData();
    return interaction.reply(`🎧 ボイスXP倍率を **${rate}** に設定しました！（1分あたり）`);
  }

  //---------------------------------------------------
  // /excluderole /excludeuser /excludechannel
  //---------------------------------------------------
  const exclude = (type, id) => {
    if (!guildData[type].includes(id)) guildData[type].push(id);
    saveData();
  };

  if (interaction.commandName === "excluderole") {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
      return interaction.reply({ content: "⚠️ 管理者専用コマンドです。", ephemeral: true });

    const role = interaction.options.getRole("role");
    exclude("excludedRoles", role.id);
    return interaction.reply(`🚫 ロール **${role.name}** をXP除外に設定しました。`);
  }

  if (interaction.commandName === "excludeuser") {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
      return interaction.reply({ content: "⚠️ 管理者専用コマンドです。", ephemeral: true });

    const user = interaction.options.getUser("user");
    exclude("excludedUsers", user.id);
    return interaction.reply(`🚫 ユーザー **${user.username}** をXP除外に設定しました。`);
  }

  if (interaction.commandName === "excludechannel") {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
      return interaction.reply({ content: "⚠️ 管理者専用コマンドです。", ephemeral: true });

    const channel = interaction.options.getChannel("channel");
    exclude("excludedChannels", channel.id);
    return interaction.reply(`🚫 チャンネル **${channel.name}** をXP除外に設定しました。`);
  }

  //---------------------------------------------------
  // /rank (TXPとVXP)
  //---------------------------------------------------
  if (interaction.commandName === "rank") {
    const userId = interaction.user.id;
    const txp = guildData.txp[userId] || 0;
    const vxp = guildData.vxp[userId] || 0;
    await interaction.reply(`📊 ${interaction.user.username}さんのランク\n📝 TXP: ${txp}\n🎧 VXP: ${vxp}`);
  }

  //---------------------------------------------------
  // /rankings (ランキング)
  //---------------------------------------------------
  if (interaction.commandName === "rankings") {
    const type = interaction.options.getString("type");
    const xpData = guildData[type];
    if (!xpData || Object.keys(xpData).length === 0)
      return interaction.reply("📉 データがまだありません。");

    const sorted = Object.entries(xpData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    let result = sorted
      .map(([id, xp], i) => `**${i + 1}.** <@${id}> — ${xp} XP`)
      .join("\n");

    await interaction.reply(`🏆 **${type.toUpperCase()} ランキングTOP10**\n${result}`);
  }
});


