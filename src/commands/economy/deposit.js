import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getUser, updateUser } from "../../utils/core/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("deposit")
        .setDescription("銀行にお金を預けます")
        .addStringOption(option =>
            option
                .setName("amount")
                .setDescription("預ける金額（数字 or all）")
                .setRequired(true)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        const amountRaw = interaction.options.getString("amount");
        const user = getUser(guildId, userId);

        if (!user.money) user.money = 0;
        if (!user.bank) user.bank = 0;

        let amount;

        // --- all（全額）処理 ---
        if (amountRaw.toLowerCase() === "all") {
            amount = user.money;
            if (amount <= 0) {
                return interaction.reply({
                    content: "❌ 預けられるお金がありません。",
                    ephemeral: true
                });
            }
        } 
        // --- 数字処理 ---
        else {
            amount = parseInt(amountRaw, 10);
            if (isNaN(amount) || amount <= 0) {
                return interaction.reply({
                    content: "❌ 金額は正しい数字を入力してください。",
                    ephemeral: true
                });
            }
            if (amount > user.money) {
                return interaction.reply({
                    content: "❌ 手持ちより多い金額は預けられません！",
                    ephemeral: true
                });
            }
        }

        // --- お金移動 ---
        user.money -= amount;
        user.bank += amount;
        updateUser(guildId, userId, user);

        // --- 埋め込みメッセージ ---
        const embed = new EmbedBuilder()
            .setTitle("🏦 入金完了")
            .setColor("#00c3ff")
            .setDescription(
                `**${amount.toLocaleString()}** を銀行に預けました！`
            )
            .addFields(
                {
                    name: "💰 所持金（Wallet）",
                    value: `${user.money.toLocaleString()}`,
                    inline: true
                },
                {
                    name: "🏦 銀行（Bank）",
                    value: `${user.bank.toLocaleString()}`,
                    inline: true
                },
                {
                    name: "📊 合計資産",
                    value: `${(user.money + user.bank).toLocaleString()}`,
                    inline: false
                }
            )

        await interaction.reply({ embeds: [embed] });
    }
};
