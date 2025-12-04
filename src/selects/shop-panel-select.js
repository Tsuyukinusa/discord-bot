import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
    customId: "shop-panel-select",

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const channel = interaction.channel;

        const db = await readGuildDB();
        if (!db[guildId]) db[guildId] = {};
        if (!db[guildId].items) db[guildId].items = {};
        if (!db[guildId].shopPanels) db[guildId].shopPanels = {};

        const selectedIds = interaction.values; // ← 選択されたID配列

        // 選ばれたアイテム
        const items = selectedIds.map(id => db[guildId].items[id]);

        // --- ショップ埋め込み ---
        const embed = new EmbedBuilder()
            .setColor("#00c8ff")
            .setTitle("🛒 アイテムショップ")
            .setDescription("以下のアイテムが購入できます！");

        items.forEach(item => {
            embed.addFields({
                name: `✨ ${item.name}`,
                value:
                    `📄 ${item.description}\n` +
                    `💰 **価格:** ${item.sellPrice}\n` +
                    (item.stock !== null ? `📦 在庫: ${item.stock}` : `♾ 在庫: 無限`),
                inline: false
            });
        });

        // --- 購入ボタン ---
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("shop-buy")
                .setLabel("購入画面を開く")
                .setStyle(ButtonStyle.Primary)
        );

        // チャンネルにショップを設置
        const msg = await channel.send({
            embeds: [embed],
            components: [row]
        });

        // 保存（パネル情報）
        db[guildId].shopPanels[msg.id] = {
            items: selectedIds
        };

        await writeGuildDB(db);

        // 選択メニューへは完了通知だけ（表示しないタイプ）
        return interaction.update({
            content: "ショップパネルを作成しました！",
            components: []
        });
    }
};
