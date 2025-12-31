import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";

import { getAllUsers } from "../../utils/core/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("サーバーの資産ランキングを表示します"),

    async execute(interaction) {
        const guildId = interaction.guild.id;

        // --- 全ユーザー取得 ---
        const all = getAllUsers()[guildId] || {};

        const usersArray = Object.entries(all).map(([id, data]) => ({
            id,
            total: (data.money || 0) + (data.bank || 0),
            money: data.money || 0,
            bank: data.bank || 0
        }));

        // --- 降順にソート ---
        usersArray.sort((a, b) => b.total - a.total);

        // --- ページング ---
        const page = 1;
        const perPage = 10;
        const maxPage = Math.ceil(usersArray.length / perPage);

        const show = usersArray.slice((page - 1) * perPage, page * perPage);

        // --- 埋め込み作成 ---
        const embed = new EmbedBuilder()
            .setTitle("🏆 資産ランキング - Leaderboard")
            .setColor(0xffcc00)
            .setFooter({ text: `ページ ${page} / ${maxPage}` })
            .setDescription(
                show
                    .map((u, i) => {
                        const rank = i + 1;
                        return `**${rank}位** <@${u.id}> — 💰 **${u.total.toLocaleString()}**`;
                    })
                    .join("\n")
            );

        // --- ボタン行 ---
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`rank-prev:${page}`)
                .setLabel("◀")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),

            new ButtonBuilder()
                .setCustomId(`rank-next:${page}`)
                .setLabel("▶")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(maxPage === 1)
        );

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    }
};
