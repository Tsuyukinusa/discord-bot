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
  if (msg.content === "ぬさ") msg.channel.send("ぬさw");
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
// 💰 経済システム
//==============================

if (!data.economy) data.economy = {};
saveData();

function initUser(gid, uid) {
  if (!data.economy[gid]) data.economy[gid] = {};
  if (!data.economy[gid][uid])
    data.economy[gid][uid] = {
      wallet: data.initialMoney || 1000, // 初期所持金
      bank: 0,
      items: {},
      stocks: {}
    };
  saveData();
}

function getUser(gid, uid) {
  initUser(gid, uid);
  return data.economy[gid][uid];
}

function formatCurrency(amount, gid) {
  const currency = data.currencySymbol?.[gid] || "💰";
  const name = data.currencyName?.[gid] || "コイン";
  return `${currency}${amount} ${name}`;
}

//==============================
// 🪙 経済系スラッシュコマンド登録
//==============================
const economyCommands = [
  // 👤 残高確認
  new SlashCommandBuilder()
    .setName("balance")
    .setDescription("自分の所持金と銀行残高を確認します。"),

  // 🏦 銀行入出金
  new SlashCommandBuilder()
    .setName("deposit")
    .setDescription("銀行にお金を預けます。")
    .addIntegerOption(o => o.setName("amount").setDescription("金額").setRequired(true)),

  new SlashCommandBuilder()
    .setName("withdraw")
    .setDescription("銀行からお金を引き出します。")
    .addIntegerOption(o => o.setName("amount").setDescription("金額").setRequired(true)),

  // 💸 送金
  new SlashCommandBuilder()
    .setName("pay")
    .setDescription("他のユーザーにお金を送金します。")
    .addUserOption(o => o.setName("target").setDescription("送り先ユーザー").setRequired(true))
    .addIntegerOption(o => o.setName("amount").setDescription("送金額").setRequired(true)),

  // 💼 仕事
  new SlashCommandBuilder()
    .setName("work")
    .setDescription("働いてお金を稼ぎます。（クールタイムあり）"),

  // 💣 犯罪
  new SlashCommandBuilder()
    .setName("crime")
    .setDescription("犯罪でお金を稼ごうとします（罰金の可能性あり）"),

  // 🏆 所持金ランキング
  new SlashCommandBuilder()
    .setName("balancetop")
    .setDescription("所持金ランキングを表示します。"),

  // 🏛️ 管理者専用：通貨設定・付与・減額など
  new SlashCommandBuilder()
    .setName("setcurrency")
    .setDescription("通貨名と絵文字を設定します。")
    .addStringOption(o => o.setName("name").setDescription("通貨の名前").setRequired(true))
    .addStringOption(o => o.setName("emoji").setDescription("通貨の絵文字").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("addmoney")
    .setDescription("ユーザーにお金を付与します。")
    .addUserOption(o => o.setName("user").setDescription("対象ユーザー").setRequired(true))
    .addIntegerOption(o => o.setName("amount").setDescription("金額").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("removemoney")
    .setDescription("ユーザーからお金を減らします。")
    .addUserOption(o => o.setName("user").setDescription("対象ユーザー").setRequired(true))
    .addIntegerOption(o => o.setName("amount").setDescription("金額").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(c => c.toJSON());

// 経済コマンドも登録
(async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [...commands, ...economyCommands] });
    console.log("✅ 経済コマンド登録完了！");
  } catch (err) {
    console.error(err);
  }
})();

//==============================
// 💰 経済コマンド実行
//==============================
const workCooldown = new Map();
const crimeCooldown = new Map();

client.on("interactionCreate", async i => {
  if (!i.isChatInputCommand()) return;
  const gid = i.guild.id;
  const uid = i.user.id;
  initUser(gid, uid);
  const userData = getUser(gid, uid);

  // 👤 balance
  if (i.commandName === "balance") {
    return i.reply(
      `💼 **${i.user.username}の残高**\n所持金: ${formatCurrency(userData.wallet, gid)}\n銀行: ${formatCurrency(userData.bank, gid)}`
    );
  }

  // 🏦 deposit
  if (i.commandName === "deposit") {
    const amount = i.options.getInteger("amount");
    if (userData.wallet < amount) return i.reply("💸 所持金が足りません。");
    userData.wallet -= amount;
    userData.bank += amount;
    saveData();
    return i.reply(`🏦 銀行に ${formatCurrency(amount, gid)} 預けました。`);
  }

  // 💰 withdraw
  if (i.commandName === "withdraw") {
    const amount = i.options.getInteger("amount");
    if (userData.bank < amount) return i.reply("🏦 銀行残高が足りません。");
    userData.bank -= amount;
    userData.wallet += amount;
    saveData();
    return i.reply(`💸 銀行から ${formatCurrency(amount, gid)} 引き出しました。`);
  }

  // 💸 pay
  if (i.commandName === "pay") {
    const target = i.options.getUser("target");
    const amount = i.options.getInteger("amount");
    if (target.id === uid) return i.reply("🙃 自分には送金できません。");
    if (userData.wallet < amount) return i.reply("💰 所持金が足りません。");
    initUser(gid, target.id);
    const targetData = getUser(gid, target.id);
    userData.wallet -= amount;
    targetData.wallet += amount;
    saveData();
    return i.reply(`💸 ${target.username} に ${formatCurrency(amount, gid)} 送金しました！`);
  }

  // 💼 work
  if (i.commandName === "work") {
    const cooldown = workCooldown.get(uid);
    if (cooldown && Date.now() - cooldown < 1000 * 60 * 5)
      return i.reply("⏳ 仕事は5分に1回しかできません。");
    const earn = Math.floor(Math.random() * 200) + 100;
    userData.wallet += earn;
    saveData();
    workCooldown.set(uid, Date.now());
    return i.reply(`💼 一生懸命働いて ${formatCurrency(earn, gid)} を稼ぎました！`);
  }

  // 💣 crime
  if (i.commandName === "crime") {
    const cooldown = crimeCooldown.get(uid);
    if (cooldown && Date.now() - cooldown < 1000 * 60 * 10)
      return i.reply("⏳ 犯罪は10分に1回しかできません。");
    const chance = Math.random();
    if (chance < 0.3) {
      const fine = Math.floor(Math.random() * 300) + 100;
      userData.wallet = Math.max(0, userData.wallet - fine);
      saveData();
      crimeCooldown.set(uid, Date.now());
      return i.reply(`🚨 捕まって罰金 ${formatCurrency(fine, gid)} を払いました！`);
    } else {
      const earn = Math.floor(Math.random() * 500) + 200;
      userData.wallet += earn;
      saveData();
      crimeCooldown.set(uid, Date.now());
      return i.reply(`😈 犯罪に成功して ${formatCurrency(earn, gid)} を稼ぎました！`);
    }
  }

  // 🏆 balancetop
  if (i.commandName === "balancetop") {
    const users = Object.entries(data.economy[gid] || {}).sort(
      (a, b) => b[1].wallet + b[1].bank - (a[1].wallet + a[1].bank)
    );
    const top = users.slice(0, 10);
    return i.reply(
      `🏆 **残高ランキング**\n${top
        .map(([id, v], idx) => `**${idx + 1}.** <@${id}> — ${formatCurrency(v.wallet + v.bank, gid)}`)
        .join("\n")}`
    );
  }

  // 🏛️ 管理者
  if (i.commandName === "setcurrency") {
    const name = i.options.getString("name");
    const emoji = i.options.getString("emoji");
    if (!data.currencyName) data.currencyName = {};
    if (!data.currencySymbol) data.currencySymbol = {};
    data.currencyName[gid] = name;
    data.currencySymbol[gid] = emoji;
    saveData();
    return i.reply(`💱 通貨を ${emoji}${name} に設定しました。`);
  }

  if (i.commandName === "addmoney") {
    const user = i.options.getUser("user");
    const amount = i.options.getInteger("amount");
    initUser(gid, user.id);
    const targetData = getUser(gid, user.id);
    targetData.wallet += amount;
    saveData();
    return i.reply(`💰 ${user.username} に ${formatCurrency(amount, gid)} 付与しました。`);
  }

  if (i.commandName === "removemoney") {
    const user = i.options.getUser("user");
    const amount = i.options.getInteger("amount");
    initUser(gid, user.id);
    const targetData = getUser(gid, user.id);
    targetData.wallet = Math.max(0, targetData.wallet - amount);
    saveData();
    return i.reply(`💸 ${user.username} から ${formatCurrency(amount, gid)} 減額しました。`);
  }
});
//==============================
// 💰 経済・持ち物・株・利息システム
//==============================

if (!data.economy) data.economy = {};
if (!data.items) data.items = {};
if (!data.stocks) {
  data.stocks = {
    "NusaTech": { price: 120, dividend: 2.5 },
    "KumaFoods": { price: 85, dividend: 1.8 },
    "ShinoaEnergy": { price: 210, dividend: 3.2 }
  };
}
if (!data.interestPeriod) data.interestPeriod = 7;

// 💰 経済データ初期化
function initUser(gid, uid) {
  if (!data.economy[gid]) data.economy[gid] = {};
  if (!data.economy[gid][uid])
    data.economy[gid][uid] = { balance: 1000, lastWork: 0, items: [] };
}

//==============================
// 💰 コマンド登録追加
//==============================
commands.push(
  new SlashCommandBuilder().setName("balance").setDescription("自分の所持金を確認します。"),
  new SlashCommandBuilder().setName("work").setDescription("働いてお金を稼ぎます。"),
  new SlashCommandBuilder().setName("inventory").setDescription("自分の持ち物を確認します。"),
  new SlashCommandBuilder()
    .setName("giveitem")
    .setDescription("他のユーザーにアイテムを渡します。")
    .addUserOption(o => o.setName("user").setDescription("相手").setRequired(true))
    .addStringOption(o => o.setName("item").setDescription("渡すアイテム名").setRequired(true)),
  new SlashCommandBuilder()
    .setName("stocks")
    .setDescription("株の一覧を表示します。"),
  new SlashCommandBuilder()
    .setName("setinterest")
    .setDescription("利息付与の期間を設定します（日単位）")
    .addIntegerOption(o => o.setName("days").setDescription("期間（日）").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
);

//==============================
// 💰 コマンド動作追加
//==============================
client.on("interactionCreate", async i => {
  if (!i.isChatInputCommand()) return;
  const gid = i.guild?.id;
  if (!gid) return;
  initGuild(gid);

  const uid = i.user.id;
  initUser(gid, uid);

  // 💰 balance
  if (i.commandName === "balance") {
    const bal = data.economy[gid][uid].balance;
    return i.reply(`💰 ${i.user.username} さんの所持金：**${bal}** コイン`);
  }

  // 💼 work
  if (i.commandName === "work") {
    const now = Date.now();
    const user = data.economy[gid][uid];
    const cooldown = 1000 * 60 * 5; // 5分クールダウン
    if (now - user.lastWork < cooldown) {
      const left = Math.ceil((cooldown - (now - user.lastWork)) / 60000);
      return i.reply(`⏳ もう少し休憩を！あと ${left} 分後に再度働けます。`);
    }
    const earn = Math.floor(Math.random() * 200) + 50;
    user.balance += earn;
    user.lastWork = now;
    saveData();
    return i.reply(`💼 ${i.user.username} さんは働いて **${earn} コイン** 稼ぎました！`);
  }

  // 📦 inventory
  if (i.commandName === "inventory") {
    const items = data.economy[gid][uid].items;
    if (items.length === 0) return i.reply("📦 持ち物は空です。");
    return i.reply(`🎒 ${i.user.username} さんの持ち物：\n${items.join(", ")}`);
  }

  // 🎁 giveitem
  if (i.commandName === "giveitem") {
    const target = i.options.getUser("user");
    const item = i.options.getString("item");
    initUser(gid, target.id);

    const user = data.economy[gid][uid];
    if (!user.items.includes(item)) return i.reply("❌ そのアイテムは持っていません。");

    user.items = user.items.filter(i => i !== item);
    data.economy[gid][target.id].items.push(item);
    saveData();
    return i.reply(`🎁 ${i.user.username} さんが ${target.username} さんに「${item}」を渡しました。`);
  }

  // 📈 stocks
  if (i.commandName === "stocks") {
    const stockList = Object.entries(data.stocks)
      .map(([name, info]) => `📊 **${name}** — 💵${info.price} ｜ 💰配当: ${info.dividend}%`)
      .join("\n");
    return i.reply(`🏦 **株式一覧**\n${stockList}`);
  }

  // 🏦 setinterest
  if (i.commandName === "setinterest") {
    const days = i.options.getInteger("days");
    data.interestPeriod = days;
    saveData();
    return i.reply(`🏦 利息の付与期間を **${days}日** に設定しました。`);
  }
});

//==============================
// 🔑 ログイン
//==============================
client.login(TOKEN);
