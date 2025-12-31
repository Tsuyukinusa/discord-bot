import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getUser, updateUser } from "../../utils/core/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("withdraw")
        .setDescription("銀行から手持ちにお金を引き出します")
        .addStringOption(option =>
            option
                .setName("amount")
                .setDescription("引き出す金額（数字 or all）")
                .setRequired(true)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        const user = getUser(guildId, userId);
        if (!user.balance) user.balance = 0;
        if (!user.bank) user.bank = 0;

        const amountInput = interaction.options.getString("amount");

        let amount;

        // --- 全額引き出し ---
        if (amountInput.toLowerCase() === "all") {
            amount = user.bank;
        } else {
            amount = Number(amountInput);
            if (isNaN(amount) || amount <= 0) {
                return interaction.reply({
                    content: "❌ 金額は正しい数字で入力してください。",
                    ephemeral: true
                });
            }
        }

        // --- 残高チェック ---
        if (amount > user.bank) {
            return interaction.reply({
                content: `❌ 銀行にそんなに入っていません。\n現在の銀行残高：**${user.bank}**`,
                ephemeral: true
            });
        }

        // --- 更新 ---
        user.bank -= amount;
        user.balance += amount;
        updateUser(guildId, userId, user);

        // --- 埋め込み返信 ---
        const embed = new EmbedBuilder()
            .setColor("#00c3ff")
            .setTitle("🏦 引き出し完了")
            .setDescription(
                `💸 **${amount.toLocaleString()}** を銀行から引き出しました！\n\n` +
                `**📌 現在の残高**\n` +
                `👜 手持ち：**${user.money.toLocaleString()}**\n` +
                `🏦 銀行：**${user.bank.toLocaleString()}**`
            )
            .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
