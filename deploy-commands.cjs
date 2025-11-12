// deploy-commands.cjs
const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

console.log("TOKEN:", process.env.TOKEN);
console.log("CLIENT_ID:", process.env.CLIENT_ID);
console.log("GUILD_ID:", process.env.GUILD_ID);

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ TOKEN / CLIENT_ID / GUILD_ID が未設定です。");
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(process.cwd(), "commands");

if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));
  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    const cmd = command.default || command;
    if (cmd?.data?.toJSON) commands.push(cmd.data.toJSON());
    else if (cmd?.data) commands.push(cmd.data);
    else console.log(`⚠️ commands/${file} の command データが見つかりませんでした。`);
  }
} else {
  console.log("ℹ️ commands フォルダが見つかりません。");
}

(async () => {
  try {
    console.log("🌀 スラッシュコマンドを登録中...");
    const rest = new REST({ version: "10" }).setToken(TOKEN);
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log("✅ スラッシュコマンドを登録しました！");
  } catch (error) {
    console.error("❌ エラー:", error);
  }
})();
