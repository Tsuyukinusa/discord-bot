import {
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("xp-ignore")
    .setDescription("XP を加算しないチャンネルを管理します")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub.setName("add").setDescription("このチャンネルを XP 除外に追加")
    )
    .addSubcommand((sub) =>
      sub.setName("remove").setDescription("このチャンネルの XP 除外を解除")
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("XP 除外チャンネル一覧を表示")
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const channelId = interaction.channel.id;

    const db = await readGuildDB();
    if (!db[guildId]) db[guildId] = {};
    if (!db[guildId].xpIgnoreChannels) db[guildId].xpIgnoreChannels = [];
    const arr = db[guildId].xpIgnoreChannels;

    if (sub === "add") {
      if (!arr.includes(channelId)) {
        arr.push(channelId);
        await writeGuildDB(db);
      }
      return interaction.reply(`🚫 このチャンネルは **XP除外** に設定されました！`);
    }

    if (sub === "remove") {
      const i = arr.indexOf(channelId);
      if (i !== -1) {
        arr.splice(i, 1);
        await writeGuildDB(db);
      }
      return interaction.reply(`✅ このチャンネルは **XP除外解除** されました！`);
    }

    if (sub === "list") {
      if (arr.length === 0) {
        return interaction.reply("📭 **XP除外チャンネルはありません！**");
      }

      const channelList = arr.map((id) => `<#${id}>`).join("\n");
      return interaction.reply({
        content: `📌 **XP が加算されないチャンネル一覧：**\n${channelList}`,
        ephemeral: false,
      });
    }
  },
};
