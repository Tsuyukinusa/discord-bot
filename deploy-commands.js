import { REST, Routes } from "discord.js";
import fs from "fs";
import "dotenv/config";

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const commands = [];

// commandsフォルダのコマンドファイルを全部読み込む（もし使っている場合）
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = (await import(`./commands/${file}`)).default;
  commands.push(command.data.toJSON());
}

// 手動で登録したいコマンドをここに追加してもOK
// commands.push(new SlashCommandBuilder()....)

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("🌀 スラッシュコマンドを登録中...");
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });
    console.log("✅ スラッシュコマンドを登録しました！");
  } catch (error) {
    console.error(error);
  }
})();
