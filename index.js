const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`✅ ログイン完了: ${client.user.tag}`);
});

client.on('messageCreate', message => {
  if (message.content === 'ぬさ') {
    message.channel.send('ぬさ！✨');
  }
});

client.login(process.env.TOKEN);
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


