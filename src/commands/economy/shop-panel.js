import {
    SlashCommandBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} from "discord.js";
import { readGuildDB } from "../../utils/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("shop-panel")
        .setDescription("ショップパネルを作成します（最大 20 アイテム）"),

    async execute(interaction) {
        const guildId = interaction.guild.id;

        const db = await readGuildDB();
        if (!db[guildId]) db[guildId] = {};
        if (!db[guildId].items) db[guildId].items = {};

        const items = db[guildId].items;

        // アイテムが 0 の場合は中断
        if (Object.keys(items).length === 0) {
            return interaction.reply({
                content: "❌ まだアイテムがありません。先に `/item-create` で作ってください。",
                ephemeral: true
            });
        }

        // --- 選択メニュー生成 ---
        const menu = new StringSelectMenuBuilder()
            .setCustomId("shop-panel-select")
            .setPlaceholder("ショップに並べるアイテムを選んでください（最大20個）")
            .setMinValues(1)
            .setMaxValues(Math.min(20, Object.keys(items).length))
            .addOptions(
                Object.entries(items).map(([id, item]) => ({
                    label: item.name,
                    value: id,
                    description: `在庫: ${item.stock ?? 0}`,
                }))
            );

        const row = new ActionRowBuilder().addComponents(menu);

        // --- 通知なし、ただ選択メニューを表示 ---
        await interaction.reply({
            content: "🛒 **ショップに並べるアイテムを選んでください**",
            components: [row],
            ephemeral: true
        });
    }
};
