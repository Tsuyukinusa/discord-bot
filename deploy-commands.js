import { REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";
import "dotenv/config";

const clientId = process.env.CLIENT_ID;
const token = process.env.TOKEN;

async function loadCommands(dir) {
  let commands = [];

  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      const subCommands = await loadCommands(fullPath);
      commands = commands.concat(subCommands);
    } else if (file.name.endsWith(".js")) {
      const commandModule = await import(fullPath);
      const command = commandModule.default;

      if (command?.data) {
        commands.push(command.data.toJSON());
      }
    }
  }

  return commands;
}

const commandsPath = path.join(process.cwd(), "src", "commands");
const commands = await loadCommands(commandsPath);

console.log(`📦 読み込んだコマンド数: ${commands.length}`);

const rest = new REST({ version: "10" }).setToken(token);

try {
  console.log("🚀 Discord にコマンドを登録中...");

  await rest.put(
    Routes.applicationCommands(clientId),
    { body: commands }
  );

  console.log("✅ コマンド登録完了！");
} catch (error) {
  console.error("❌ エラー:", error);
}
