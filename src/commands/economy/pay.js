import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getUser, updateUser } from "../../utils/core/file.js";

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

        // --- データ取得 ---
        const sender = getUser(guildId, senderId);
        const receiver = getUser(guildId, targetUser.id);

        if (!sender.money) sender.money = 0;
        if (!receiver.money) receiver.money = 0;

        // --- 金額計算 ---
        let amount;

        if (amountInput.toLowerCase() === "all") {
            amount = sender.money;
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

        // --- 埋め込み返信 ---
        const embed = new EmbedBuilder()
            .setColor("#00c3ff")
            .setTitle("💸 送金完了")
            .setDescription(
                `**${interaction.user.username}** → **${targetUser.username}** に送金しました！\n\n` +
                `💰 **${amount.toLocaleString()}**`
            )
            .addFields(
                {
                    name: "📌 あなたの残高",
                    value: `👜 所持金：**${sender.money.toLocaleString()}**`,
                    inline: true
                },
                {
                    name: "📌 相手の残高",
                    value: `👜 所持金：**${receiver.money.toLocaleString()}**`,
                    inline: true
                }
            )
            .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
