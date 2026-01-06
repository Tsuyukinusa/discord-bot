// src/commands/admin/removemoney.js
import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { getBalance, subtractBalance } from "../../services/economyService.js";

export const data = new SlashCommandBuilder()
  .setName("removemoney")
  .setDescription("指定したユーザーのお金を減らします（管理者用）")
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
      .setDescription("減らす金額")
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

  const balance = await getBalance(guildId, user.id);

  if (balance < amount) {
    return interaction.reply({
      content: "そのユーザーはそんなにお金を持っていません。",
      ephemeral: true
    });
  }

  await subtractBalance(guildId, user.id, amount);

  return interaction.reply({
    content: `💸 <@${user.id}> から **${amount}** 減らしました。`
  });
}
