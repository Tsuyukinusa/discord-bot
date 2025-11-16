import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("vxp-ignore-add")
    .setDescription("VXPが増えないチャンネルを追加します")
    .addChannelOption(opt =>
      opt.setName("channel")
        .setDescription("除外するVCチャンネル")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const channel = interaction.options.getChannel("channel");
    const guildId = interaction.guild.id;

    const guildDB = await readGuildDB();
    guildDB[guildId] ||= {};
    guildDB[guildId].vxpIgnoreChannels ||= [];

    if (guildDB[guildId].vxpIgnoreChannels.includes(channel.id)) {
      return interaction.reply({
        content: `⚠ このチャンネルはすでに除外されています！`,
        ephemeral: true,
      });
    }

    guildDB[guildId].vxpIgnoreChannels.push(channel.id);
    await writeGuildDB(guildDB);

    return interaction.reply({
      content: `✅ <#${channel.id}> を **VXP除外チャンネル** に追加しました！`,
      ephemeral: true,
    });
  },
};
