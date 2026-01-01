import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
} from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ES Modules 用の __dirname 再現
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ▼ Client 作成
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Channel, Partials.Message],
});

// コマンド用 Collection
client.commands = new Collection();

// ▼ commands を読み込み
const commandsPath = path.join(__dirname, "src/commands");
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  const commandFiles = fs
    .readdirSync(folderPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(folderPath, file);
    const command = (await import(filePath)).default;

    if (!command?.data || !command?.execute) {
      console.warn(`❌ コマンドが正しく export されていません: ${file}`);
      continue;
    }

    client.commands.set(command.data.name, command);
    console.log(`✔ Loaded command: ${command.data.name}`);
  }
}

// ▼ events を読み込み
const eventsPath = path.join(__dirname, "src/events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = (await import(filePath)).default;

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }

  console.log(`✔ Loaded event: ${event.name}`);
}

// ▼ Bot ログイン
client.login(process.env.TOKEN);
