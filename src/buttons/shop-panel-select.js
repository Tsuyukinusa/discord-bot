
import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
    customId: "shop-panel-select",

    async run(interaction) {
        const guildId = interaction.guild.id;
        const channelId = interaction.channel.id;

        const selectedItems = interaction.values; // ここに選ばれた itemId が入る
        const db = await readGuildDB();

        if (!db[guildId]) db[guildId] = {};
        if (!db[guildId].shopPanels) db[guildId].shopPanels = {};

        // パネルID（チャンネルID＋時刻でユニーク化）
        const panelId = `${channelId}-${Date.now()}`;

        // DB に保存
        db[guildId].shopPanels[panelId] = {
            channelId,
            items: selectedItems,
            createdAt: Date.now()
        };

        await writeGuildDB(db);

        // 表示用の埋め込み
        const embed = new EmbedBuilder()
            .setTitle("🛒 アイテムショップ")
            .setDescription("以下のアイテムを購入できます！")
            .setColor("#00b5ff");

        for (const id of selectedItems) {
            const item = db[guildId].items[id];
            embed.addFields({
                name: `${item.name}（ID: ${id}）`,
                value: `💰 **価格:** ${item.sellPrice}\n📦 **在庫:** ${item.stock ?? "∞"}`
            });
        }

        // ボタン（購入ボタン）
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`buy-item`)
                .setLabel("購入する")
                .setStyle(ButtonStyle.Primary)
        );

        // チャンネルにパネルを送信
        await interaction.channel.send({
            embeds: [embed],
            components: [row]
        });

        // 返信（元のメッセージに）
        return interaction.update({
            content: "✅ ショップパネルを作成しました！",
            components: []
        });
    }
};
