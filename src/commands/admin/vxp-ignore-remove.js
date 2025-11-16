import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("vxp-ignore-remove")
    .setDescription("VXP除外チャンネルを解除します")
    .addChannelOption(opt =>
      opt.setName("channel")
        .setDescription("除外から外すチャンネル")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const channel = interaction.options.getChannel("channel");
    const guildId = interaction.guild.id;

    const guildDB = await readGuildDB();
    guildDB[guildId] ||= {};
    guildDB[guildId].vxpIgnoreChannels ||= [];

    const list = guildDB[guildId].vxpIgnoreChannels;

    if (!list.includes(channel.id)) {
      return interaction.reply({
        content: "⚠ このチャンネルは除外されていません。",
        ephemeral: true,
      });
    }

    guildDB[guildId].vxpIgnoreChannels = list.filter(id => id !== channel.id);
    await writeGuildDB(guildDB);

    return interaction.reply({
      content: `🗑️ <#${channel.id}> を VXP除外リストから削除しました！`,
      ephemeral: true,
    });
  },
};
