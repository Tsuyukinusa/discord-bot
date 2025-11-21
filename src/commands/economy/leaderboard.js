import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getAllUsers } from "../../utils/userdb.js";

export default {
    data: new SlashCommandBuilder()
        .setName("rank")
        .setDescription("サーバーの総資産ランキングを表示します"),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const allUsers = getAllUsers()[guildId] || {};

        // --- ユーザーデータを配列にまとめる ---
        const usersArray = Object.entries(allUsers).map(([id, data]) => ({
            id,
            money: data.money || 0,
            bank: data.bank || 0,
            total: (data.money || 0) + (data.bank || 0)
        }));

        // 一人も経済データが無い場合
        if (usersArray.length === 0) {
            return interaction.reply("まだ誰も経済データを持っていません。");
        }

        // --- 降順でソート ---
        usersArray.sort((a, b) => b.total - a.total);

        // --- 上位10人のみ ---
        const top = usersArray.slice(0, 10);

        // --- ランキングの文字を作成 ---
        let desc = top
            .map((u, i) => {
                const member = interaction.guild.members.cache.get(u.id);
                const name = member ? member.user.username : "不明ユーザー";

                return `**${i + 1}位** — ${name}\n💰 所持金: **${u.money.toLocaleString()}**　🏛️ 銀行: **${u.bank.toLocaleString()}**　💎 総資産: **${u.total.toLocaleString()}**`;
            })
            .join("\n\n");

        const embed = new EmbedBuilder()
            .setColor("#00c3ff")
            .setTitle("🏆 サーバー総資産ランキング TOP10")
            .setDescription(desc)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
