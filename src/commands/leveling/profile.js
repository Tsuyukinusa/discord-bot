import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { createProfileCard } from "../../services/profileService.js";

export default {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("プロフィールカードを表示します")
    .addUserOption(opt =>
      opt.setName("user")
        .setDescription("表示するユーザー")
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("user") || interaction.user;
    await interaction.deferReply();
    const buffer = await createProfileCard(interaction.guild.id, user);

    const attachment = new AttachmentBuilder(buffer, { name: "profile.png" });
    await interaction.editReply({ files: [attachment] });
  },
};
