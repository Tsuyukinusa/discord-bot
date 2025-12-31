import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getUser, getAllUsers } from "../../utils/core/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("balance")
        .setDescription("あなたのお金・銀行残高・総資産を表示します"),

    async execute(interaction) {

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        // --- ユーザーデータ取得 ---
        const user = getUser(guildId, userId);

        if (!user.money) user.money = 0;
        if (!user.bank) user.bank = 0;

        const total = user.money + user.bank;

        // --- ランキング計算 ---
        const allUsers = getAllUsers()[guildId] || {};
        const usersArray = Object.entries(allUsers).map(([id, data]) => ({
            id,
            total: (data.money || 0) + (data.bank || 0)
        }));

        usersArray.sort((a, b) => b.total - a.total);

        const rank = usersArray.findIndex(u => u.id === userId) + 1;
        const totalUsers = usersArray.length;

        // --- 埋め込み作成 ---
        const embed = new EmbedBuilder()
            .setColor("#00c3ff")
            .setTitle(`🏦 ${interaction.user.username} の残高`)
            .setDescription(`**🏆 ランキング:** ${rank}位 / ${totalUsers}人中`)
            .addFields(
                {
                    name: "💰 所持金（Wallet）",
                    value: `**${user.money.toLocaleString()}**`,
                    inline: true
                },
                {
                    name: "🏛️ 銀行（Bank）",
                    value: `**${user.bank.toLocaleString()}**`,
                    inline: true
                },
                {
                    name: "💎 総資産（Total）",
                    value: `**${total.toLocaleString()}**`,
                    inline: false
                }
            )
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
