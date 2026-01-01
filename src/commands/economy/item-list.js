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

        if (!db[guildId]?.items || Object.keys(db[guildId].items).length === 0) {
            return interaction.reply({
                content: "📭 アイテムがありません。",
                ephemeral: true
            });
        }

        // 🔹 Object → Array に変換
        const items = Object.entries(db[guildId].items).map(
            ([id, data]) => ({ id, ...data })
        );

        let page = 0;
        const perPage = 5;
        const maxPage = Math.ceil(items.length / perPage);

        const getPageEmbed = (pageIndex) => {
            const start = pageIndex * perPage;
            const end = start + perPage;
            const pageItems = items.slice(start, end);

            const embed = new EmbedBuilder()
                .setTitle("📦 アイテム一覧")
                .setColor("#00bfff")
                .setFooter({ text: `ページ ${pageIndex + 1}/${maxPage}` });

            for (const item of pageItems) {
                embed.addFields({
                    name: `🆔 ${item.id}｜${item.name}`,
                    value:
                        `📄 ${item.description || "説明なし"}\n` +
                        `💰 売値：${item.sellPrice}\n` +
                        `🔧 種類：${item.type}`,
                    inline: false
                });
            }

            return embed;
        };

        const getButtons = (pageIndex) =>
            new ActionRowBuilder().addComponents(
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

        await interaction.reply({
            embeds: [getPageEmbed(page)],
            components: [getButtons(page)]
        });

        const collector = interaction.channel.createMessageComponentCollector({
            time: 60_000
        });

        collector.on("collect", async (btn) => {
            if (btn.user.id !== interaction.user.id) {
                return btn.reply({
                    content: "あなたの操作ではありません。",
                    ephemeral: true
                });
            }

            if (btn.customId === "prev" && page > 0) page--;
            if (btn.customId === "next" && page < maxPage - 1) page++;

            await btn.update({
                embeds: [getPageEmbed(page)],
                components: [getButtons(page)]
            });
        });

        collector.on("end", async () => {
            await interaction.editReply({ components: [] });
        });
    }
};
