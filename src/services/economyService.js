// src/commands/economy/pay.js
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import {
  getBalance,
  canAfford,
  subtractBalance,
  addBalance
} from "../../Services/economyServices.js";

export default {
  data: new SlashCommandBuilder()
    .setName("pay")
    .setDescription("指定したユーザーにお金を送金します")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("送金相手")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("amount")
        .setDescription("送金額（数字 or all）")
        .setRequired(true)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const senderId = interaction.user.id;

    const targetUser = interaction.options.getUser("user");
    const amountInput = interaction.options.getString("amount");

    if (targetUser.id === senderId) {
      return interaction.reply({
        content: "❌ 自分自身には送金できません。",
        ephemeral: true
      });
    }

    // --- 残高取得 ---
    const senderBalance = await getBalance(guildId, senderId);

    let amount;

    // --- 金額計算 ---
    if (amountInput.toLowerCase() === "all") {
      amount = senderBalance;
    } else {
      amount = Number(amountInput);
      if (isNaN(amount) || amount <= 0) {
        return interaction.reply({
          content: "❌ 金額は正しい数字を入力してください。",
          ephemeral: true
        });
      }
    }

    // --- 残高チェック ---
    if (!(await canAfford(guildId, senderId, amount))) {
      return interaction.reply({
        content: `❌ 残高が足りません。\n現在の残高：**${senderBalance.toLocaleString()}**`,
        ephemeral: true
      });
    }

    // --- 送金処理 ---
    await subtractBalance(guildId, senderId, amount);
    await addBalance(guildId, targetUser.id, amount);

    const newSenderBalance = senderBalance - amount;
    const receiverBalance = await getBalance(guildId, targetUser.id);

    // --- 埋め込み ---
    const embed = new EmbedBuilder()
      .setColor("#00c3ff")
      .setTitle("💸 送金完了")
      .setDescription(
        `**${interaction.user.username}** → **${targetUser.username}** に送金しました`
      )
      .addFields(
        {
          name: "💰 送金額",
          value: `${amount.toLocaleString()}`,
          inline: true
        },
        {
          name: "📌 あなたの残高",
          value: `${newSenderBalance.toLocaleString()}`,
          inline: true
        },
        {
          name: "📌 相手の残高",
          value: `${receiverBalance.toLocaleString()}`,
          inline: true
        }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
