import {
    SlashCommandBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} from "discord.js";
import { readGuildDB } from "../../utils/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("shop-panel")
        .setDescription("ショップパネルを作成します（最大20アイテム）"),

    async execute(interaction) {
        const guildId = interaction.guild.id;

        const db = await readGuildDB();
        if (!db[guildId]) db[guildId] = {};
        if (!db[guildId].items) db[guildId].items = {};

        const items = db[guildId].items;

        if (Object.keys(items).length === 0) {
            return interaction.reply({
                content: "❌ まだアイテムがありません。",
                ephemeral: true
            });
        }

        // 選択メニュー
        const menu = new StringSelectMenuBuilder()
            .setCustomId("shop-panel-select")
            .setPlaceholder("並べるアイテムを選択（最大20）")
            .setMinValues(1)
            .setMaxValues(Math.min(20, Object.keys(items).length))
            .addOptions(
                Object.entries(items).map(([id, item]) => ({
                    label: item.name,
                    value: id,
                    description: `在庫: ${item.stock ?? "∞"}`
                }))
            );

        const row = new ActionRowBuilder().addComponents(menu);

        await interaction.reply({
            content: "🛒 ショップに並べるアイテムを選んでください！",
            components: [row],
            ephemeral: true
        });
    }
};
