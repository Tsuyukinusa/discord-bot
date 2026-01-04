// src/commands/admin/addmoney.js
import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { addBalance } from "../../services/economyService.js";

export const data = new SlashCommandBuilder()
  .setName("addmoney")
  .setDescription("指定したユーザーにお金を追加します（管理者用）")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addUserOption(opt =>
    opt
      .setName("user")
      .setDescription("対象ユーザー")
      .setRequired(true)
  )
  .addIntegerOption(opt =>
    opt
      .setName("amount")
      .setDescription("追加する金額")
      .setRequired(true)
  );

export async function execute(interaction) {
  const user = interaction.options.getUser("user");
  const amount = interaction.options.getInteger("amount");
  const guildId = interaction.guildId;

  if (amount <= 0) {
    return interaction.reply({
      content: "金額は正の数で指定してください。",
      ephemeral: true
    });
  }
  await addBalance(guildId, user.id, amount);

  return interaction.reply({
    content: `💰 <@${user.id}> に **${amount}** 追加しました。`
  });
}
