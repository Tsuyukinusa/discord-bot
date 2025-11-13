// deploy-commands.js
import { REST, Routes } from 'discord.js';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ファイルパス設定
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// commandsフォルダ内のスラッシュコマンドを読み込み
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const commandModule = await import(`file://${filePath}`);
  if (commandModule.data) {
    commands.push(commandModule.data.toJSON());
  }
}

// REST設定
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// スラッシュコマンド登録
try {
  console.log('🌀 スラッシュコマンドをDiscordに登録中…');

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands },
  );

  console.log('✅ スラッシュコマンドの登録が完了しました！');
} catch (error) {
  console.error('❌ コマンド登録中にエラーが発生しました:', error);
}
