import { EmbedBuilder } from "discord.js";

/**
 * ショップパネルの Embed を生成する関数
 * @param {Object} panelData - パネル情報
 * @param {Object} items - 全アイテムデータ
 * @returns {EmbedBuilder}
 */
export function createShopEmbed(panelData, items) {
    const embed = new EmbedBuilder()
        .setColor("#00b7ff")
        .setTitle("🛒 アイテムショップ")
        .setDescription("購入したいアイテムを選んでください！")
        .setFooter({ text: `Shop Panel ID: ${panelData.panelId}` })
        .setTimestamp();

    // --- アイテム一覧 ---
    const lines = panelData.itemIds.map(id => {
        const item = items[id];
        if (!item) return null;
        return `**${item.name}** — 💰${item.sellPrice} / 在庫: ${item.stock ?? "∞"}`;
    }).filter(Boolean);

    embed.addFields({
        name: "📦 ショップ商品一覧",
        value: lines.join("\n")
    });

    return embed;
}
