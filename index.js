//==============================
// ⚙️ Discord多機能Bot 完全統合版
//==============================

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

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

//==============================
// 🎯 クライアント設定
//==============================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.once("ready", () => {
  console.log(`✅ ログイン完了: ${client.user.tag}`);
});

client.on("messageCreate", msg => {
  if (msg.content === "ぬさ") msg.channel.send("ぬさ！✨");
});

//==============================
// 💾 データ保存
//==============================
const dataFile = path.join(__dirname, "data.json");
let data = fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile)) : {};

function saveData() {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function initGuild(gid) {
  if (!data[gid]) {
    data[gid] = {
      welcomeEnabled: true,
      welcomeMessage: "🎉 ようこそ、{user} さん！",
      welcomeChannel: null,
      txp: {},
      vxp: {},
      xpRate: 1,
      vxpRate: 1,
      levels: {},
      levelRoles: {},
      levelUpChannel: null,
      levelUpMessage: "{user} さんが Lv.{level} にレベルアップ！✨",
      excludedUsers: [],
      excludedRoles: [],
      excludedChannels: []
    };
  }
}

//==============================
// 🎉 お迎え
//==============================
client.on("guildMemberAdd", member => {
  const gid = member.guild.id;
  initGuild(gid);
  const g = data[gid];
  if (!g.welcomeEnabled) return;

  const ch = g.welcomeChannel
    ? member.guild.channels.cache.get(g.welcomeChannel)
    : member.guild.systemChannel;

  if (ch) ch.send(g.welcomeMessage.replace("{user}", member.user.username));
});

//==============================
// 💬 TXP加算
//==============================
client.on("messageCreate", message => {
  if (!message.guild || message.author.bot) return;
  const gid = message.guild.id;
  initGuild(gid);
  const g = data[gid];

  if (g.excludedUsers.includes(message.author.id)) return;
  if (g.excludedChannels.includes(message.channel.id)) return;
  if (message.member.roles.cache.some(r => g.excludedRoles.includes(r.id))) return;

  const uid = message.author.id;
  g.txp[uid] = (g.txp[uid] || 0) + g.xpRate;
  checkLevelUp(message.member, g);
  saveData();
});

//==============================
// 🎧 VXP加算
//==============================
const voiceTimes = new Map();

client.on("voiceStateUpdate", (oldS, newS) => {
  const m = newS.member;
  if (!m || m.user.bot) return;
  const gid = m.guild.id;
  initGuild(gid);
  const g = data[gid];

  if (newS.channelId && !oldS.channelId) voiceTimes.set(m.id, Date.now());
  else if (!newS.channelId && oldS.channelId) {
    const start = voiceTimes.get(m.id);
    if (!start) return;
    const min = Math.floor((Date.now() - start) / 60000);
    voiceTimes.delete(m.id);
    if (min > 0) {
      g.vxp[m.id] = (g.vxp[m.id] || 0) + min * g.vxpRate;
      checkLevelUp(m, g);
      saveData();
    }
  }
});

//==============================
// 🆙 レベルアップ判定
//==============================
function checkLevelUp(member, g) {
  const uid = member.id;
  g.levels[uid] = g.levels[uid] || 0;
  const totalXP = (g.txp[uid] || 0) + (g.vxp[uid] || 0);
  const nextXP = 100 * (g.levels[uid] + 1); // 必要XP

  if (totalXP >= nextXP) {
    g.levels[uid]++;
    const level = g.levels[uid];

    const msg = g.levelUpMessage
      .replace("{user}", member.user.username)
      .replace("{level}", level);

    if (g.levelUpChannel) {
      const ch = member.guild.channels.cache.get(g.levelUpChannel);
      if (ch) ch.send(msg);
    }

    // ロール付与
    if (g.levelRoles[level]) {
      const role = member.guild.roles.cache.get(g.levelRoles[level]);
      if (role) {
        member.roles.add(role).catch(() => {});
        member.send(`🎖️ レベル${level}に到達し、ロール「${role.name}」を獲得しました！`).catch(() => {});
      }
    }
    saveData();
  }
}

//==============================
// ⚙️ スラッシュコマンド
//==============================
const commands = [
  new SlashCommandBuilder().setName("rank").setDescription("自分のランクを確認します。"),
  new SlashCommandBuilder()
    .setName("rankings")
    .setDescription("TXP/VXPのランキングを表示します。")
    .addStringOption(o =>
      o.setName("type").setDescription("txpまたはvxp").setRequired(true)
        .addChoices({ name: "TXP", value: "txp" }, { name: "VXP", value: "vxp" })
    ),
  new SlashCommandBuilder()
    .setName("setxp").setDescription("TXP倍率を設定")
    .addNumberOption(o => o.setName("rate").setDescription("倍率").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName("setvxp").setDescription("VXP倍率を設定")
    .addNumberOption(o => o.setName("rate").setDescription("倍率").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName("setlevelrole")
    .setDescription("指定レベル到達時に付与するロールを設定")
    .addIntegerOption(o => o.setName("level").setDescription("レベル").setRequired(true))
    .addRoleOption(o => o.setName("role").setDescription("付与するロール").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName("setlevelupmessage")
    .setDescription("レベルアップ通知メッセージを設定（{user}, {level}対応）")
    .addStringOption(o => o.setName("message").setDescription("メッセージ").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName("setlevelupchannel")
    .setDescription("レベルアップ通知チャンネルを設定")
    .addChannelOption(o => o.setName("channel").setDescription("通知チャンネル").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName("setwelcomechannel")
    .setDescription("お迎えメッセージの送信先チャンネルを設定")
    .addChannelOption(o => o.setName("channel").setDescription("送信チャンネル").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(c => c.toJSON());

//==============================
// 🚀 登録
//==============================
const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("✅ スラッシュコマンド登録完了！");
  } catch (err) {
    console.error(err);
  }
})();

//==============================
// 🎮 コマンド実行
//==============================
client.on("interactionCreate", async i => {
  if (!i.isChatInputCommand()) return;
  const gid = i.guild.id;
  initGuild(gid);
  const g = data[gid];

  if (i.commandName === "rank") {
    const uid = i.user.id;
    const txp = g.txp[uid] || 0;
    const vxp = g.vxp[uid] || 0;
    const level = g.levels[uid] || 0;
    return i.reply(`📊 ${i.user.username} さん\n📝TXP: ${txp}\n🎧VXP: ${vxp}\n🏅レベル: ${level}`);
  }

  if (i.commandName === "rankings") {
    const type = i.options.getString("type");
    const xp = g[type];
    if (!xp || !Object.keys(xp).length) return i.reply("📉 データがありません。");
    const sorted = Object.entries(xp).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return i.reply(
      `🏆 **${type.toUpperCase()}ランキングTOP10**\n${sorted
        .map(([id, v], n) => `**${n + 1}.** <@${id}> — ${v}`)
        .join("\n")}`
    );
  }

  if (i.commandName === "setxp") {
    g.xpRate = i.options.getNumber("rate");
    saveData();
    return i.reply(`🧮 テキストXP倍率を ${g.xpRate} に設定しました。`);
  }

  if (i.commandName === "setvxp") {
    g.vxpRate = i.options.getNumber("rate");
    saveData();
    return i.reply(`🎧 ボイスXP倍率を ${g.vxpRate} に設定しました。`);
  }

  if (i.commandName === "setlevelrole") {
    const lvl = i.options.getInteger("level");
    const role = i.options.getRole("role");
    g.levelRoles[lvl] = role.id;
    saveData();
    return i.reply(`🎖️ Lv.${lvl} に達した時にロール「${role.name}」を付与します。`);
  }

  if (i.commandName === "setlevelupmessage") {
    g.levelUpMessage = i.options.getString("message");
    saveData();
    return i.reply("📝 レベルアップメッセージを変更しました。");
  }

  if (i.commandName === "setlevelupchannel") {
    g.levelUpChannel = i.options.getChannel("channel").id;
    saveData();
    return i.reply("📢 レベルアップ通知チャンネルを設定しました。");
  }

  if (i.commandName === "setwelcomechannel") {
    g.welcomeChannel = i.options.getChannel("channel").id;
    saveData();
    return i.reply("📩 お迎えメッセージの送信チャンネルを設定しました。");
  }
});

//==============================
// 🔑 ログイン
//==============================
client.login(TOKEN);
