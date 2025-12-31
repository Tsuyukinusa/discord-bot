import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";
import { readGuildDB } from "../../utils/core/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("item-list")
        .setDescription("アイテム一覧をページで表示します"),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const db = await readGuildDB();

        if (!db[guildId] || !db[guildId].items || db[guildId].items.length === 0) {
            return interaction.reply({
                content: "📭 アイテムがありません。",
                ephemeral: true
            });
        }

        const items = db[guildId].items;
        let page = 0;
        const maxPage = Math.ceil(items.length / 5);

        const getPageEmbed = (pageIndex) => {
            const start = pageIndex * 5;
            const end = start + 5;
            const pageItems = items.slice(start, end);

            const embed = new EmbedBuilder()
                .setTitle("📦 アイテム一覧")
                .setColor("#00bfff")
                .setFooter({ text: `ページ ${pageIndex + 1}/${maxPage}` });

            pageItems.forEach(item => {
                embed.addFields({
                    name: `${item.name} （ID: ${item.id}）`,
                    value: `💲売値：**${item.sell}**\n⚡効果：**${item.effect}**`,
                    inline: false
                });
            });

            return embed;
        };

        // ボタン作成
        const getButtons = (pageIndex) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("prev")
                    .setLabel("⬅ 前へ")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(pageIndex === 0),

                new ButtonBuilder()
                    .setCustomId("next")
                    .setLabel("次へ ➡")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(pageIndex >= maxPage - 1)
            );
        };

        await interaction.reply({
            embeds: [getPageEmbed(page)],
            components: [getButtons(page)]
        });

        // --- ボタン処理 ---
        const collector = interaction.channel.createMessageComponentCollector({
            time: 60_000
        });

        collector.on("collect", async (btn) => {
            if (btn.user.id !== interaction.user.id) {
                return btn.reply({ content: "あなたの操作ではありません。", ephemeral: true });
            }

            if (btn.customId === "prev" && page > 0) page--;
            if (btn.customId === "next" && page < maxPage - 1) page++;

            await btn.update({
                embeds: [getPageEmbed(page)],
                components: [getButtons(page)]
            });
        });

        collector.on("end", async () => {
            // 時間切れ → ボタン無効化
            await interaction.editReply({
                components: []
            });
        });
    }
};
