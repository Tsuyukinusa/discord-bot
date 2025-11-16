import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { readGuildDB } from "../../utils/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("vxp-ignore-list")
    .setDescription("VXPが増えないチャンネル一覧を表示します")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const guildDB = await readGuildDB();
    const list = guildDB[guildId]?.vxpIgnoreChannels || [];

    if (list.length === 0) {
      return interaction.reply({
        content: "📭 除外チャンネルはありません！",
        ephemeral: true,
      });
    }

    const formatted = list.map(id => `• <#${id}>`).join("\n");

    return interaction.reply({
      content: `📌 **VXP除外チャンネル一覧**\n${formatted}`,
      ephemeral: true,
    });
  },
};
