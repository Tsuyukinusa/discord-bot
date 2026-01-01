// src/commands/economy/pay.js
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getUser, updateUser } from "../../utils/core/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("pay")
    .setDescription("指定したユーザーにお金を送金します")
    .addUserOption(opt =>
      opt.setName("user")
        .setDescription("送金相手")
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("amount")
        .setDescription("送金額（数字 or all）")
        .setRequired(true)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const senderId = interaction.user.id;
    const targetUser = interaction.options.getUser("user");
    const amountInput = interaction.options.getString("amount");

    // 自分自身に送金不可
    if (targetUser.id === senderId) {
      return interaction.reply({
        content: "❌ 自分自身には送金できません。",
        ephemeral: true
      });
    }

    // --- ユーザーデータ取得 & 初期化 ---
    const sender = getUser(guildId, senderId) ?? { money: 0 };
    const receiver = getUser(guildId, targetUser.id) ?? { money: 0 };

    sender.money ??= 0;
    receiver.money ??= 0;

    // --- 金額処理 ---
    let amount;

    if (amountInput.toLowerCase() === "all") {
      amount = sender.money;
    } else {
      amount = Number(amountInput);
      if (!Number.isInteger(amount) || amount <= 0) {
        return interaction.reply({
          content: "❌ 金額は正の数字で入力してください。",
          ephemeral: true
        });
      }
    }

    if (amount <= 0) {
      return interaction.reply({
        content: "❌ 送金できる金額がありません。",
        ephemeral: true
      });
    }

    if (amount > sender.money) {
      return interaction.reply({
        content: `❌ 所持金が足りません。\n現在の所持金：**${sender.money.toLocaleString()}**`,
        ephemeral: true
      });
    }

    // --- 送金処理 ---
    sender.money -= amount;
    receiver.money += amount;

    updateUser(guildId, senderId, sender);
    updateUser(guildId, targetUser.id, receiver);

    // --- 埋め込み ---
    const embed = new EmbedBuilder()
      .setColor("#00c3ff")
      .setTitle("💸 送金完了")
      .setDescription(
        `**${interaction.user.username}** → **${targetUser.username}**\n\n` +
        `💰 **${amount.toLocaleString()}**`
      )
      .addFields(
        {
          name: "あなたの残高",
          value: `👜 ${sender.money.toLocaleString()}`,
          inline: true
        },
        {
          name: "相手の残高",
          value: `👜 ${receiver.money.toLocaleString()}`,
          inline: true
        }
      )
      .setTimestamp();

    return interaction.reply({
      embeds: [embed],
      ephemeral: true // 公開したければ消してOK
    });
  }
};
