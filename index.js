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

const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("✅ スラッシュコマンド登録完了！");
  } catch (err) {
    console.error(err);
  }
})();

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
// 💵 refund（ここから追加）
if (i.commandName === "refund") {
  // ここに返金処理のソースコードを貼る
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

if (!data.stocks) data.stocks = {};
if (!data.stockIntervalHours) data.stockIntervalHours = 1;
if (!data.stockFluctuationRate) data.stockFluctuationRate = 5.0;

function saveData() {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

commands.push(
  new SlashCommandBuilder()
    .setName("addstock")
    .setDescription("新しい会社（株）を追加します。")
    .addStringOption(o => o.setName("name").setDescription("会社名").setRequired(true))
    .addIntegerOption(o => o.setName("price").setDescription("初期株価").setRequired(true))
    .addNumberOption(o => o.setName("dividend").setDescription("配当率（例：0.05）").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("removestock")
    .setDescription("会社（株）を削除します。")
    .addStringOption(o => o.setName("name").setDescription("会社名").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("editstock")
    .setDescription("会社（株）の情報を変更します。")
    .addStringOption(o => o.setName("name").setDescription("会社名").setRequired(true))
    .addIntegerOption(o => o.setName("price").setDescription("新しい株価").setRequired(false))
    .addNumberOption(o => o.setName("dividend").setDescription("新しい配当率（例：0.05）").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("stocks")
    .setDescription("登録されている株会社一覧を表示します。")
);

client.on("interactionCreate", async i => {
  if (!i.isChatInputCommand()) return;
  const gid = i.guild?.id;
  if (!gid) return;

  // 📈 株会社追加
  if (i.commandName === "addstock") {
    const name = i.options.getString("name");
    const price = i.options.getInteger("price");
    const dividend = i.options.getNumber("dividend");

    if (data.stocks[name]) return i.reply("❌ その会社はすでに存在します。");
    if (price <= 0 || dividend < 0) return i.reply("❌ 無効な値です。");

    data.stocks[name] = { price, dividend };
    saveData();
    return i.reply(`🏢 株会社 **${name}** を追加しました！\n📊 初期株価: ${price}\n💰 配当率: ${(dividend * 100).toFixed(2)}%`);
  }

  // ❌ 株会社削除
  if (i.commandName === "removestock") {
    const name = i.options.getString("name");
    if (!data.stocks[name]) return i.reply("❌ その会社は存在しません。");
    delete data.stocks[name];
    saveData();
    return i.reply(`🗑️ 株会社 **${name}** を削除しました。`);
  }

  // ✏️ 株会社編集
  if (i.commandName === "editstock") {
    const name = i.options.getString("name");
    const price = i.options.getInteger("price");
    const dividend = i.options.getNumber("dividend");
    const stock = data.stocks[name];
    if (!stock) return i.reply("❌ その会社は存在しません。");

    if (price && price > 0) stock.price = price;
    if (dividend && dividend >= 0) stock.dividend = dividend;
    saveData();
    return i.reply(`✏️ 株会社 **${name}** の情報を更新しました。\n📈 株価: ${stock.price}\n💰 配当率: ${(stock.dividend * 100).toFixed(2)}%`);
  }

  // 📃 株会社一覧
  if (i.commandName === "stocks") {
    if (Object.keys(data.stocks).length === 0)
      return i.reply("📭 登録されている会社はありません。");

    const list = Object.entries(data.stocks)
      .map(([name, s]) => `🏢 **${name}** | 株価: ${s.price} | 配当率: ${(s.dividend * 100).toFixed(2)}%`)
      .join("\n");

    return i.reply(`💹 現在の登録会社一覧:\n${list}`);
  }
});

let stockIntervalTask = null;

function restartStockInterval() {
  if (stockIntervalTask) clearInterval(stockIntervalTask);
  const intervalMs = data.stockIntervalHours * 60 * 60 * 1000;

  stockIntervalTask = setInterval(() => {
    for (const [name, stock] of Object.entries(data.stocks)) {
      const range = data.stockFluctuationRate;
      const rate = (Math.random() * range * 2 - range) / 100; // ±range%
      stock.price = Math.max(10, Math.floor(stock.price * (1 + rate)));
    }
    saveData();
    console.log(`📈 株価変動実行（${data.stockIntervalHours}時間間隔 ±${data.stockFluctuationRate}%）`);
  }, intervalMs);
}

restartStockInterval();

// n時間ごとの変動設定
if (!data.stockIntervalHours) data.stockIntervalHours = 3; // デフォルト3時間ごと
if (!data.stockFluctuationRate) data.stockFluctuationRate = 5.0; // ±5%
if (!data.stockNotifyChannel) data.stockNotifyChannel = null; // 通知チャンネルID

// 💬 通知チャンネルを設定するスラッシュコマンド
commands.push(
  new SlashCommandBuilder()
    .setName("setstockchannel")
    .setDescription("株価変動通知を送信するチャンネルを設定します。")
    .addChannelOption(o =>
      o.setName("channel").setDescription("通知チャンネル").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("setstockinterval")
    .setDescription("株価が自動で変動する間隔（時間）を設定します。")
    .addNumberOption(o =>
      o.setName("hours").setDescription("間隔（時間単位）").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
);

// スラッシュコマンド処理追加
client.on("interactionCreate", async i => {
  if (!i.isChatInputCommand()) return;

  // 📢 通知チャンネル設定
  if (i.commandName === "setstockchannel") {
    const ch = i.options.getChannel("channel");
    data.stockNotifyChannel = ch.id;
    saveData();
    return i.reply(`📢 株価通知チャンネルを ${ch} に設定しました。`);
  }

  // ⏰ 更新間隔設定
  if (i.commandName === "setstockinterval") {
    const hours = i.options.getNumber("hours");
    if (hours < 0.5) return i.reply("⏳ 最小でも0.5時間（30分）以上にしてください。");

    data.stockIntervalHours = hours;
    saveData();
    restartStockFluctuation(); // 再起動
    return i.reply(`⏰ 株価の自動更新間隔を **${hours}時間ごと** に設定しました。`);
  }
});

// 💹 株価変動ロジック
let stockFluctuationTimer = null;

function restartStockFluctuation() {
  if (stockFluctuationTimer) clearInterval(stockFluctuationTimer);

  const intervalMs = data.stockIntervalHours * 60 * 60 * 1000;

  stockFluctuationTimer = setInterval(() => {
    if (!data.stocks || Object.keys(data.stocks).length === 0) return;

    let notifyMsg = "💹 **株価更新情報** 💹\n";

    for (const [name, stock] of Object.entries(data.stocks)) {
      const oldPrice = stock.price;
      const range = data.stockFluctuationRate;
      const rate = (Math.random() * range * 2 - range) / 100; // ±range%
      const newPrice = Math.max(10, Math.floor(oldPrice * (1 + rate)));
      const diffRate = ((newPrice - oldPrice) / oldPrice) * 100;

      stock.price = newPrice;

      // A株（配当総数の例として表示）
      const A = Math.floor(stock.dividend * 100);
      notifyMsg += `🏢 **${name}**\n📈 株価: ${oldPrice} → **${newPrice}**（${diffRate.toFixed(2)}%）\n💰 配当: ${A} 株\n\n`;
    }

    saveData();

    console.log(`📈 株価自動更新 (${data.stockIntervalHours}時間ごと実行)`);

    // 通知送信
    if (data.stockNotifyChannel) {
      client.channels
        .fetch(data.stockNotifyChannel)
        .then(ch => ch.send(notifyMsg))
        .catch(() => console.log("⚠️ 株価通知チャンネルに送信できませんでした。"));
    }
  }, intervalMs);
}

// 起動時に開始
client.once("ready", () => {
  restartStockFluctuation();
});

// n時間ごとの変動設定
if (!data.stockIntervalHours) data.stockIntervalHours = 3; // デフォルト3時間ごと
if (!data.stockFluctuationRate) data.stockFluctuationRate = 5.0; // ±5%
if (!data.stockNotifyChannel) data.stockNotifyChannel = null; // 通知チャンネルID

// 💬 通知チャンネルを設定するスラッシュコマンド
commands.push(
  new SlashCommandBuilder()
    .setName("setstockchannel")
    .setDescription("株価変動通知を送信するチャンネルを設定します。")
    .addChannelOption(o =>
      o.setName("channel").setDescription("通知チャンネル").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("setstockinterval")
    .setDescription("株価が自動で変動する間隔（時間）を設定します。")
    .addNumberOption(o =>
      o.setName("hours").setDescription("間隔（時間単位）").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
);

// スラッシュコマンド処理追加
client.on("interactionCreate", async i => {
  if (!i.isChatInputCommand()) return;

  // 📢 通知チャンネル設定
  if (i.commandName === "setstockchannel") {
    const ch = i.options.getChannel("channel");
    data.stockNotifyChannel = ch.id;
    saveData();
    return i.reply(`📢 株価通知チャンネルを ${ch} に設定しました。`);
  }

  // ⏰ 更新間隔設定
  if (i.commandName === "setstockinterval") {
    const hours = i.options.getNumber("hours");
    if (hours < 0.5) return i.reply("⏳ 最小でも0.5時間（30分）以上にしてください。");

    data.stockIntervalHours = hours;
    saveData();
    restartStockFluctuation(); // 再起動
    return i.reply(`⏰ 株価の自動更新間隔を **${hours}時間ごと** に設定しました。`);
  }
});

// 💹 株価変動ロジック
let stockFluctuationTimer = null;

function restartStockFluctuation() {
  if (stockFluctuationTimer) clearInterval(stockFluctuationTimer);

  const intervalMs = data.stockIntervalHours * 60 * 60 * 1000;

  stockFluctuationTimer = setInterval(() => {
    if (!data.stocks || Object.keys(data.stocks).length === 0) return;

    let notifyMsg = "💹 **株価更新情報** 💹\n";

    for (const [name, stock] of Object.entries(data.stocks)) {
      const oldPrice = stock.price;
      const range = data.stockFluctuationRate;
      const rate = (Math.random() * range * 2 - range) / 100; // ±range%
      const newPrice = Math.max(10, Math.floor(oldPrice * (1 + rate)));
      const diffRate = ((newPrice - oldPrice) / oldPrice) * 100;

      stock.price = newPrice;

      // A株（配当総数の例として表示）
      const A = Math.floor(stock.dividend * 100);
      notifyMsg += `🏢 **${name}**\n📈 株価: ${oldPrice} → **${newPrice}**（${diffRate.toFixed(2)}%）\n💰 配当: ${A} 株\n\n`;
    }

    saveData();

    console.log(`📈 株価自動更新 (${data.stockIntervalHours}時間ごと実行)`);

    // 通知送信
    if (data.stockNotifyChannel) {
      client.channels
        .fetch(data.stockNotifyChannel)
        .then(ch => ch.send(notifyMsg))
        .catch(() => console.log("⚠️ 株価通知チャンネルに送信できませんでした。"));
    }
  }, intervalMs);
}

// 起動時に開始
client.once("ready", () => {
  restartStockFluctuation();
});

commands.push(
  new SlashCommandBuilder()
    .setName("setfluctuationrate")
    .setDescription("株価変動率（±％）を設定します。")
    .addNumberOption(o =>
      o.setName("rate").setDescription("変動率（例: 5 → ±5%）").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
);

// コマンド処理追加
client.on("interactionCreate", async i => {
  if (!i.isChatInputCommand()) return;

  if (i.commandName === "setfluctuationrate") {
    const rate = i.options.getNumber("rate");

    if (rate <= 0 || rate > 100) {
      return i.reply("⚠️ 変動率は 1〜100 の範囲で入力してください。");
    }

    data.stockFluctuationRate = rate;
    saveData();
    return i.reply(`📈 株価変動率を ±${rate}% に設定しました！`);
  }
});

const { createCanvas } = require("canvas");
const { AttachmentBuilder } = require("discord.js");

// 株価履歴を保存する構造
if (!data.stockHistory) data.stockHistory = {}; // { companyName: [価格, 価格, ...] }

function recordStockPrice(company, price) {
  if (!data.stockHistory[company]) data.stockHistory[company] = [];
  data.stockHistory[company].push(price);

  // 履歴が100件を超えたら古いものを削除
  if (data.stockHistory[company].length > 100) {
    data.stockHistory[company].shift();
  }
  saveData();
}

commands.push(
  new SlashCommandBuilder()
    .setName("stockgraph")
    .setDescription("指定した会社の株価履歴グラフを表示します。")
    .addStringOption(o =>
      o.setName("company").setDescription("会社名").setRequired(true)
    )
);

async function generateStockGraph(company) {
  const prices = data.stockHistory[company];
  if (!prices || prices.length < 2) return null;

  const width = 800;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // 背景
  ctx.fillStyle = "#202225";
  ctx.fillRect(0, 0, width, height);

  // 枠線
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 20, width - 60, height - 60);

  // スケール
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  const range = max - min || 1;

  // 折れ線グラフ
  ctx.beginPath();
  ctx.strokeStyle = "#00ff88";
  ctx.lineWidth = 3;

  prices.forEach((p, i) => {
    const x = 40 + (i / (prices.length - 1)) * (width - 80);
    const y = height - 40 - ((p - min) / range) * (height - 80);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // テキスト
  ctx.fillStyle = "#ffffff";
  ctx.font = "20px Sans";
  ctx.fillText(`📈 ${company} 株価履歴`, 50, 40);
  ctx.fillText(`最新価格: ${prices[prices.length - 1]}`, 50, height - 15);

  return new AttachmentBuilder(canvas.toBuffer(), { name: `${company}_graph.png` });
}

client.on("interactionCreate", async i => {
  if (!i.isChatInputCommand()) return;

  if (i.commandName === "stockgraph") {
    const company = i.options.getString("company");

    if (!data.stocks || !data.stocks[company]) {
      return i.reply("❌ その会社は存在しません。");
    }

    const graph = await generateStockGraph(company);
    if (!graph) {
      return i.reply("📉 株価履歴が少なすぎます。もう少し経過を待ってください。");
    }

    return i.reply({ content: `📊 ${company} の株価推移です。`, files: [graph] });
  }
});

const { createCanvas } = require("canvas");
const { AttachmentBuilder } = require("discord.js");

// 株価履歴を保存する構造
if (!data.stockHistory) data.stockHistory = {}; // { companyName: [価格, 価格, ...] }

function recordStockPrice(company, price) {
  if (!data.stockHistory[company]) data.stockHistory[company] = [];
  data.stockHistory[company].push(price);

  // 履歴が100件を超えたら古いものを削除
  if (data.stockHistory[company].length > 100) {
    data.stockHistory[company].shift();
  }
  saveData();
}

commands.push(
  new SlashCommandBuilder()
    .setName("stockgraph")
    .setDescription("指定した会社の株価履歴グラフを表示します。")
    .addStringOption(o =>
      o.setName("company").setDescription("会社名").setRequired(true)
    )
);

async function generateStockGraph(company) {
  const prices = data.stockHistory[company];
  if (!prices || prices.length < 2) return null;

  const width = 800;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // 背景
  ctx.fillStyle = "#202225";
  ctx.fillRect(0, 0, width, height);

  // 枠線
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 20, width - 60, height - 60);

  // スケール
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  const range = max - min || 1;

  // 折れ線グラフ
  ctx.beginPath();
  ctx.strokeStyle = "#00ff88";
  ctx.lineWidth = 3;

  prices.forEach((p, i) => {
    const x = 40 + (i / (prices.length - 1)) * (width - 80);
    const y = height - 40 - ((p - min) / range) * (height - 80);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // テキスト
  ctx.fillStyle = "#ffffff";
  ctx.font = "20px Sans";
  ctx.fillText(`📈 ${company} 株価履歴`, 50, 40);
  ctx.fillText(`最新価格: ${prices[prices.length - 1]}`, 50, height - 15);

  return new AttachmentBuilder(canvas.toBuffer(), { name: `${company}_graph.png` });
}
client.on("interactionCreate", async i => {
  if (!i.isChatInputCommand()) return;

  if (i.commandName === "stockgraph") {
    const company = i.options.getString("company");

    if (!data.stocks || !data.stocks[company]) {
      return i.reply("❌ その会社は存在しません。");
    }

    const graph = await generateStockGraph(company);
    if (!graph) {
      return i.reply("📉 株価履歴が少なすぎます。もう少し経過を待ってください。");
    }

    return i.reply({ content: `📊 ${company} の株価推移です。`, files: [graph] });
  }
});
import matplotlib.pyplot as plt
import random
import asyncio
from datetime import datetime, timedelta
import io
import discord

# ====== 株価データと設定 ======
stock_data = {
    "name": "株式会社A",
    "price": 1000,
    "dividend": 5.0,  # 配当割合（%）
    "history": []
}

stock_settings = {
    "change_rate": 5.0,  # 株価変動率 ±%
    "change_hour": 9,    # 株価変動を行う時刻（例：毎日9時）
    "change_count_per_day": 1  # 1日に何回変動するか
}

# ====== 株価変動設定コマンド ======
@bot.tree.command(name="setstock", description="株の基本情報を設定します（管理者専用）")
@app_commands.describe(
    name="会社名",
    change_rate="株価変動率（±％）",
    change_hour="株価変動を行う時刻（0〜23）",
    change_count="1日に株価を変動させる回数"
)
@commands.has_permissions(administrator=True)
async def setstock(interaction: discord.Interaction, name: str, change_rate: float, change_hour: int, change_count: int):
    stock_data["name"] = name
    stock_settings["change_rate"] = change_rate
    stock_settings["change_hour"] = change_hour
    stock_settings["change_count_per_day"] = change_count

    await interaction.response.send_message(
        f"✅ 株設定を更新しました！\n"
        f"会社名：{name}\n"
        f"変動率：±{change_rate}%\n"
        f"変動時間：毎日{change_hour}時\n"
        f"1日あたり変動回数：{change_count}回"
    )

# ====== 株価を変動させる処理 ======
async def update_stock_price():
    while True:
        now = datetime.now()
        change_hour = stock_settings["change_hour"]
        change_count = stock_settings["change_count_per_day"]

        # 1日に複数回変動する場合
        intervals = [change_hour + i * (24 // change_count) for i in range(change_count)]

        for hour in intervals:
            # 次の更新時刻を計算
            next_update = datetime(now.year, now.month, now.day, hour, 0)
            if now >= next_update:
                next_update += timedelta(days=1)

            wait_time = (next_update - now).total_seconds()
            await asyncio.sleep(wait_time)

            # 株価を変動させる
            old_price = stock_data["price"]
            rate = random.uniform(-stock_settings["change_rate"], stock_settings["change_rate"])
            new_price = round(old_price * (1 + rate / 100))
            stock_data["price"] = new_price

            # 履歴を保存
            stock_data["history"].append((datetime.now(), new_price))
            if len(stock_data["history"]) > 50:
                stock_data["history"].pop(0)

            # 配当の計算
            dividend_total = round(new_price * stock_data["dividend"] / 100)

            # グラフ生成
            times = [t.strftime("%H:%M") for t, _ in stock_data["history"]]
            prices = [p for _, p in stock_data["history"]]
            plt.figure(figsize=(6, 3))
            plt.plot(times, prices, marker="o", linestyle="-", label="株価推移")
            plt.title(f"{stock_data['name']} 株価推移")
            plt.xlabel("時間")
            plt.ylabel("株価")
            plt.grid(True)
            plt.legend()
            buf = io.BytesIO()
            plt.savefig(buf, format="png")
            buf.seek(0)
            plt.close()

            # 通知送信
            channel = discord.
# ====== 株価通知チャンネルの設定 ======
stock_channel_id = None  # 通知先チャンネルIDを保持

@bot.tree.command(name="setstockchannel", description="株価通知を送るチャンネルを設定します（管理者専用）")
@app_commands.describe(channel="通知を送信するチャンネルを指定")
@commands.has_permissions(administrator=True)
async def setstockchannel(interaction: discord.Interaction, channel: discord.TextChannel):
    global stock_channel_id
    stock_channel_id = channel.id
    await interaction.response.send_message(f"✅ 株価通知チャンネルを {channel.mention} に設定しました！")

# ====== 複数会社対応：株データ ======
stocks = {}  # {会社名: {"price": int, "dividend": float, "rate": float, "history": [(datetime, price)]}}

# ====== 株を登録するコマンド ======
@bot.tree.command(name="addstock", description="新しい株会社を登録します（管理者専用）")
@app_commands.describe(
    name="会社名",
    price="初期株価",
    dividend="配当率（%）",
    rate="株価変動率（±%）"
)
@commands.has_permissions(administrator=True)
async def addstock(interaction: discord.Interaction, name: str, price: int, dividend: float, rate: float):
    if name in stocks:
        await interaction.response.send_message("⚠️ すでに登録されている会社です。")
        return

    stocks[name] = {
        "price": price,
        "dividend": dividend,
        "rate": rate,
        "history": [(datetime.now(), price)]
    }
    await interaction.response.send_message(
        f"🏢 株会社 **{name}** を登録しました！\n"
        f"初期株価: {price}円\n配当率: {dividend}%\n変動率: ±{rate}%"
    )

# ====== 株一覧を表示するコマンド ======
@bot.tree.command(name="stocklist", description="登録されている株会社の一覧を表示します")
async def stocklist(interaction: discord.Interaction):
    if not stocks:
        await interaction.response.send_message("📉 現在登録されている会社はありません。")
        return

    embed = discord.Embed(title="📊 登録株会社一覧", color=discord.Color.blue())
    for name, info in stocks.items():
        embed.add_field(
            name=name,
            value=(
                f"株価: {info['price']}円\n"
                f"配当率: {info['dividend']}%\n"
                f"変動率: ±{info['rate']}%"
            ),
            inline=False
        )
    await interaction.response.send_message(embed=embed)

# ====== 株価の自動変動（全会社対応） ======
async def auto_stock_update():
    global stock_channel_id
    while True:
        now = datetime.now()
        next_hour = (now + timedelta(hours=1)).replace(minute=0, second=0, microsecond=0)
        wait_time = (next_hour - now).total_seconds()
        await asyncio.sleep(wait_time)

        for name, data in stocks.items():
            old_price = data["price"]
            rate = random.uniform(-data["rate"], data["rate"])
            new_price = round(old_price * (1 + rate / 100))
            data["price"] = new_price
            data["history"].append((datetime.now(), new_price))
            if len(data["history"]) > 50:
                data["history"].pop(0)

            # 配当Aの計算
            dividend_total = round(new_price * data["dividend"] / 100)

            # グラフ生成
            times = [t.strftime("%H:%M") for t, _ in data["history"]]
            prices = [p for _, p in data["history"]]
            plt.figure(figsize=(6, 3))
            plt.plot(times, prices, marker="o", linestyle="-", label="株価推移")
            plt.title(f"{name} 株価推移")
            plt.xlabel("時間")
            plt.ylabel("株価")
            plt.grid(True)
            plt.legend()
            buf = io.BytesIO()
            plt.savefig(buf, format="png")
            buf.seek(0)
            plt.close()

            # 通知送信
            if stock_channel_id:
                channel = bot.get_channel(stock_channel_id)
                if channel:
                    embed = discord.Embed(
                        title=f"📈 株価変動通知 - {name}",
                        description=(
                            f"**新株価:** {new_price}円（{rate:+.2f}%）\n"
                            f"**配当:** A（合計配当 {dividend_total}円）"
                        ),
                        color=discord.Color.green() if rate >= 0 else discord.Color.red(),
                        timestamp=datetime.now()
                    )
                    file = discord.File(buf, filename=f"{name}_chart.png")
                    embed.set_image(url=f"attachment://{name}_chart.png")
                    await channel.send(embed=embed, file=file)

# ====== 起動時に自動タスク開始 ======
@bot.event
async def on_ready():
    print(f"✅ Bot起動完了: {bot.user}")
    bot.loop.create_task(auto_stock_update())
# ====== ユーザーの所持データ ======
user_data = {}  # {user_id: {"money": int, "stocks": {会社名: {"amount": int, "avg_price": float}}}}

def get_user(uid):
    if uid not in user_data:
        user_data[uid] = {"money": 100000, "stocks": {}}
    return user_data[uid]

# ====== 個別株情報を表示 ======
@bot.tree.command(name="stockinfo", description="指定した会社の株情報とグラフを表示します")
@app_commands.describe(name="会社名")
async def stockinfo(interaction: discord.Interaction, name: str):
    if name not in stocks:
        await interaction.response.send_message("⚠️ その会社は存在しません。")
        return

    data = stocks[name]
    times = [t.strftime("%H:%M") for t, _ in data["history"]]
    prices = [p for _, p in data["history"]]

    # グラフ作成
    plt.figure(figsize=(6, 3))
    plt.plot(times, prices, marker="o", linestyle="-", label="株価推移")
    plt.title(f"{name} 株価推移")
    plt.xlabel("時間")
    plt.ylabel("株価（円）")
    plt.grid(True)
    plt.legend()
    buf = io.BytesIO()
    plt.savefig(buf, format="png")
    buf.seek(0)
    plt.close()

    embed = discord.Embed(
        title=f"🏢 {name} の株情報",
        description=(
            f"📈 現在株価: {data['price']}円\n"
            f"💰 配当率: {data['dividend']}%\n"
            f"📊 株価変動率: ±{data['rate']}%"
        ),
        color=discord.Color.blue()
    )
    file = discord.File(buf, filename=f"{name}_chart.png")
    embed.set_image(url=f"attachment://{name}_chart.png")

    await interaction.response.send_message(embed=embed, file=file)

# ====== 株を購入 ======
@bot.tree.command(name="buy", description="株を購入します")
@app_commands.describe(name="会社名", amount="購入株数")
async def buy(interaction: discord.Interaction, name: str, amount: int):
    user = get_user(interaction.user.id)
    if name not in stocks:
        await interaction.response.send_message("⚠️ その会社は存在しません。")
        return

    if amount <= 0:
        await interaction.response.send_message("⚠️ 正しい株数を入力してください。")
        return

    price = stocks[name]["price"] * amount
    if user["money"] < price:
        await interaction.response.send_message(f"💸 所持金が足りません！必要金額: {price}円")
        return

    user["money"] -= price
    stock_info = user["stocks"].get(name, {"amount": 0, "avg_price": 0})
    total_cost = stock_info["avg_price"] * stock_info["amount"] + stocks[name]["price"] * amount
    total_shares = stock_info["amount"] + amount
    stock_info["avg_price"] = total_cost / total_shares
    stock_info["amount"] = total_shares
    user["stocks"][name] = stock_info

    await interaction.response.send_message(
        f"✅ {name} の株を {amount} 株購入しました！\n"
        f"💰 残高: {user['money']}円\n"
        f"📈 平均取得価格: {round(stock_info['avg_price'])}円"
    )

# ====== 株を売却 ======
@bot.tree.command(name="sell", description="株を売却します")
@app_commands.describe(name="会社名", amount="売却株数")
async def sell(interaction: discord.Interaction, name: str, amount: int):
    user = get_user(interaction.user.id)
    if name not in stocks:
        await interaction.response.send_message("⚠️ その会社は存在しません。")
        return

    if name not in user["stocks"] or user["stocks"][name]["amount"] < amount:
        await interaction.response.send_message("⚠️ 売却できる株数が足りません。")
        return

    if amount <= 0:
        await interaction.response.send_message("⚠️ 正しい株数を入力してください。")
        return

    sell_price = stocks[name]["price"] * amount
    user["money"] += sell_price
    user["stocks"][name]["amount"] -= amount

    if user["stocks"][name]["amount"] == 0:
        del user["stocks"][name]

    await interaction.response.send_message(
        f"💹 {name} の株を {amount} 株売却しました！\n"
        f"📦 受取金額: {sell_price}円\n"
        f"💰 残高: {user['money']}円"
    )

# ====== 自分の保有株を見る ======
@bot.tree.command(name="mystocks", description="自分の保有株を確認します")
async def mystocks(interaction: discord.Interaction):
    user = get_user(interaction.user.id)
    if not user["stocks"]:
        await interaction.response.send_message("📭 現在保有している株はありません。")
        return

    desc = f"💰 所持金: {user['money']}円\n\n"
    for name, info in user["stocks"].items():
        now_price = stocks[name]["price"]
        gain = (now_price - info["avg_price"]) * info["amount"]
        desc += (
            f"🏢 {name}\n"
            f"株数: {info['amount']} 株\n"
            f"平均取得: {round(info['avg_price'])}円\n"
            f"現在株価: {now_price}円\n"
            f"損益: {'+' if gain>=0 else ''}{round(gain)}円\n\n"
        )

    embed = discord.Embed(title="📊 保有株一覧", description=desc, color=discord.Color.gold())
    await interaction.response.send_message(embed=embed)
const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
const { createCanvas } = require("canvas");

// ====== データ保存ファイル ======
const stockFile = path.join(__dirname, "stocks.json");
const userFile = path.join(__dirname, "users.json");

let stocks = fs.existsSync(stockFile)
  ? JSON.parse(fs.readFileSync(stockFile))
  : {};
let users = fs.existsSync(userFile)
  ? JSON.parse(fs.readFileSync(userFile))
  : {};

function saveStocks() {
  fs.writeFileSync(stockFile, JSON.stringify(stocks, null, 2));
}
function saveUsers() {
  fs.writeFileSync(userFile, JSON.stringify(users, null, 2));
}

function getUser(uid) {
  if (!users[uid]) users[uid] = { money: 100000, stocks: {} };
  return users[uid];
}

// ====== 株会社の登録 ======
client.on("ready", () => {
  if (Object.keys(stocks).length === 0) {
    stocks = {
      "NusaTech": {
        price: 1000,
        dividend: 3,
        rate: 5,
        history: [],
      },
      "ShinoaFoods": {
        price: 800,
        dividend: 2,
        rate: 3,
        history: [],
      },
    };
    saveStocks();
  }
});

// ====== 株価変動設定 ======
const stockChange = {
  intervalHours: 3, // 何時間ごとに変動するか（管理者が後で変更可）
  targetTime: "12:00", // 特定時間指定も可能（例: "09:00"）
};

// ====== 株価変動関数 ======
function updateStockPrices() {
  const now = new Date();
  for (const [name, s] of Object.entries(stocks)) {
    const change = (Math.random() * 2 - 1) * s.rate;
    const newPrice = Math.max(10, Math.round(s.price * (1 + change / 100)));

    s.history.push({ time: now.toLocaleTimeString(), price: newPrice });
    if (s.history.length > 15) s.history.shift();

    const diff = newPrice - s.price;
    const sign = diff >= 0 ? "📈" : "📉";
    s.price = newPrice;

    // 配当金 (全員に配る)
    let totalDiv = 0;
    for (const [uid, u] of Object.entries(users)) {
      if (u.stocks[name]) {
        const div = Math.round(u.stocks[name].amount * (s.dividend / 100));
        if (div > 0) {
          u.money += div;
          totalDiv += div;
          const userObj = client.users.cache.get(uid);
          if (userObj) {
            userObj.send(`💰 株式会社「${name}」から配当 ${div}A を受け取りました！`).catch(() => {});
          }
        }
      }
    }

    saveUsers();

    // 通知チャンネルが設定されていれば送信
    const channel = Object.values(data)
      .map(g => g.levelUpChannel && client.channels.cache.get(g.levelUpChannel))
      .find(c => c);
    if (channel) {
      channel.send(
        `🏢 **${name}** 株価更新\n${sign} 新価格: ${newPrice}円（変動率: ${change.toFixed(2)}%）\n💸 総配当: ${totalDiv}A`
      );
    }
  }
  saveStocks();
}

// ====== 株価を定期的に変動 ======
setInterval(updateStockPrices, stockChange.intervalHours * 60 * 60 * 1000);

client.on("interactionCreate", async i => {
  if (!i.isChatInputCommand()) return;

  // /stockinfo
  if (i.commandName === "stockinfo") {
    const name = i.options.getString("name");
    if (!stocks[name]) return i.reply("⚠️ その会社は存在しません。");

    const s = stocks[name];
    const canvas = createCanvas(600, 300);
    const ctx = canvas.getContext("2d");

    // 背景
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, 600, 300);

    // 枠線
    ctx.strokeStyle = "#58a6ff";
    ctx.strokeRect(20, 20, 560, 260);

    // グラフ描画
    const history = s.history.length ? s.history : [{ time: "開始", price: s.price }];
    const prices = history.map(h => h.price);
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const scaleY = 200 / (max - min || 1);

    ctx.beginPath();
    ctx.moveTo(40, 280 - (prices[0] - min) * scaleY);
    prices.forEach((p, idx) => {
      const x = 40 + (idx / (prices.length - 1 || 1)) * 520;
      const y = 280 - (p - min) * scaleY;
      ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#00ffb3";
    ctx.lineWidth = 2;
    ctx.stroke();

    // テキスト
    ctx.fillStyle = "#fff";
    ctx.font = "18px Sans";
    ctx.fillText(`${name} 株価推移`, 40, 40);
    ctx.fillText(`現在株価: ${s.price}円`, 40, 70);
    ctx.fillText(`配当: ${s.dividend}%`, 40, 100);
    ctx.fillText(`変動率: ±${s.rate}%`, 40, 130);

    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: `${name}_chart.png` });

    const embed = new EmbedBuilder()
      .setTitle(`🏢 ${name} の株情報`)
      .setDescription(`💰 現在株価: ${s.price}円\n📊 配当: ${s.dividend}%\n📈 変動率: ±${s.rate}%`)
      .setColor("Blue")
      .setImage(`attachment://${name}_chart.png`);

    await i.reply({ embeds: [embed], files: [attachment] });
  }

  // /setstock
  if (i.commandName === "setstock") {
    if (!i.member.permissions.has("Administrator")) return i.reply("⚠️ 管理者のみ実行可能です。");

    const name = i.options.getString("name");
    const price = i.options.getInteger("price");
    const div = i.options.getNumber("dividend");
    const rate = i.options.getNumber("rate");

    stocks[name] = { price, dividend: div, rate, history: [] };
    saveStocks();
    i.reply(`🏢 株式会社「${name}」を登録しました。\n株価: ${price}円 / 配当: ${div}% / 変動率: ±${rate}%`);
  }

  // /setstockinterval
  if (i.commandName === "setstockinterval") {
    if (!i.member.permissions.has("Administrator")) return i.reply("⚠️ 管理者のみ実行可能です。");
    const hours = i.options.getInteger("hours");
    stockChange.intervalHours = hours;
    i.reply(`🕒 株価変動間隔を ${hours} 時間ごとに設定しました。`);
  }
});
//==============================
// 🛍️ ショップ・アイテム機能
//==============================

// アイテムデータ保存
const shopFile = path.join(__dirname, "shop.json");
let shopData = fs.existsSync(shopFile) ? JSON.parse(fs.readFileSync(shopFile)) : {};

function saveShop() {
  fs.writeFileSync(shopFile, JSON.stringify(shopData, null, 2));
}

// 在庫初期化
function initShop(gid) {
  if (!shopData[gid]) {
    shopData[gid] = { items: {}, inventory: {} };
  }
}

//==============================
// 🎮 ショップコマンド
//==============================
client.on("interactionCreate", async i => {
  if (!i.isChatInputCommand()) return;
  const gid = i.guild.id;
  initShop(gid);
  const shop = shopData[gid];
  const uid = i.user.id;

  // 💡 商品作成コマンド
  if (i.commandName === "create_item") {
    const name = i.options.getString("name");
    const price = i.options.getInteger("price");
    const cost = i.options.getInteger("cost");
    const effect = i.options.getString("effect") || "なし";
    const stock = i.options.getInteger("stock") || 1;

    if (!shop.items[name]) {
      shop.items[name] = {
        creator: i.user.username,
        price,
        cost,
        effect,
        stock
      };
      saveShop();
      return i.reply(`🛒 商品「${name}」を作成しました！\n💰価格: ${price}\n⚒️作成費: ${cost}\n🎁効果: ${effect}`);
    } else {
      return i.reply("⚠️ その商品名はすでに存在します。");
    }
  }

  // 💰 商品を買う
  if (i.commandName === "buy_item") {
    const name = i.options.getString("name");
    const amount = i.options.getInteger("amount") || 1;

    if (!shop.items[name]) return i.reply("📦 その商品は存在しません。");
    const item = shop.items[name];
    if (item.stock < amount) return i.reply("🚫 在庫が足りません。");

    const cost = item.price * amount;
    initUser(gid, uid);
    const u = getUser(gid, uid);
    if (u.wallet < cost) return i.reply("💸 所持金が足りません。");

    u.wallet -= cost;
    item.stock -= amount;
    shop.inventory[uid] = shop.inventory[uid] || {};
    shop.inventory[uid][name] = (shop.inventory[uid][name] || 0) + amount;

    saveShop();
    saveData();
    i.reply(`✅ ${amount}個の「${name}」を購入しました！`);
  }

  // 🎁 商品を使う
  if (i.commandName === "use_item") {
    const name = i.options.getString("name");
    if (!shop.inventory[uid] || !shop.inventory[uid][name])
      return i.reply("📦 その商品は持っていません。");

    shop.inventory[uid][name]--;
    if (shop.inventory[uid][name] <= 0) delete shop.inventory[uid][name];

    const effect = shop.items[name]?.effect || "なし";
    saveShop();

    i.reply(`🎉 ${name} を使いました！効果: ${effect}`);
  }

  // 🤝 商品を渡す
  if (i.commandName === "give_item") {
    const target = i.options.getUser("user");
    const name = i.options.getString("name");
    const amount = i.options.getInteger("amount") || 1;

    if (!shop.inventory[uid] || (shop.inventory[uid][name] || 0) < amount)
      return i.reply("📦 その商品を十分に持っていません。");

    shop.inventory[uid][name] -= amount;
    if (shop.inventory[uid][name] <= 0) delete shop.inventory[uid][name];

    shop.inventory[target.id] = shop.inventory[target.id] || {};
    shop.inventory[target.id][name] = (shop.inventory[target.id][name] || 0) + amount;

    saveShop();
    i.reply(`🤝 ${target.username} さんに「${name}」を ${amount}個 渡しました！`);
  }

  // 🎒 インベントリ確認
  if (i.commandName === "inventory") {
    const inv = shop.inventory[uid];
    if (!inv || Object.keys(inv).length === 0)
      return i.reply("🎒 持ち物は空です。");

    const list = Object.entries(inv)
      .map(([n, c]) => `・${n} ×${c}`)
      .join("\n");
    i.reply(`🎒 **${i.user.username}の持ち物**\n${list}`);
  }

  // 🏪 商品一覧
  if (i.commandName === "shop_list") {
    const list = Object.entries(shop.items)
      .map(
        ([n, d]) =>
          `📦 **${n}** — 💰${d.price}（在庫:${d.stock}） 作成者:${d.creator}\n効果:${d.effect}`
      )
      .join("\n\n");
    i.reply(list || "🏪 登録商品はまだありません。");
  }
});

//==============================
// 🧾 コマンド登録
//==============================
const shopCommands = [
  new SlashCommandBuilder()
    .setName("create_item")
    .setDescription("商品を作成します（効果付きも可）")
    .addStringOption(o => o.setName("name").setDescription("商品名").setRequired(true))
    .addIntegerOption(o => o.setName("price").setDescription("販売価格").setRequired(true))
    .addIntegerOption(o => o.setName("cost").setDescription("作成にかかるお金").setRequired(true))
    .addIntegerOption(o => o.setName("stock").setDescription("在庫数").setRequired(false))
    .addStringOption(o => o.setName("effect").setDescription("商品を使ったときの効果").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("buy_item")
    .setDescription("商品を購入します")
    .addStringOption(o => o.setName("name").setDescription("商品名").setRequired(true))
    .addIntegerOption(o => o.setName("amount").setDescription("購入数").setRequired(false)),

  new SlashCommandBuilder()
    .setName("use_item")
    .setDescription("持っている商品を使います")
    .addStringOption(o => o.setName("name").setDescription("商品名").setRequired(true)),

  new SlashCommandBuilder()
    .setName("give_item")
    .setDescription("他のユーザーに商品を渡します")
    .addUserOption(o => o.setName("user").setDescription("渡す相手").setRequired(true))
    .addStringOption(o => o.setName("name").setDescription("商品名").setRequired(true))
    .addIntegerOption(o => o.setName("amount").setDescription("渡す個数").setRequired(false)),

  new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("自分の持ち物を確認します"),

  new SlashCommandBuilder()
    .setName("shop_list")
    .setDescription("登録されている全商品を表示します")
].map(c => c.toJSON());

(async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: [...commands, ...shopCommands]
    });
    console.log("✅ ショップコマンド登録完了！");
  } catch (err) {
    console.error(err);
  }
})();

client.login(TOKEN);
