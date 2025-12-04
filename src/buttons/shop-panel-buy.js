// buttons/shop-panel-buy.js
import { readGuildDB, writeGuildDB } from "../../utils/file.js";
import { EmbedBuilder } from "discord.js";

export default {
    customId: "shop-buy",

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        const itemId = interaction.customIdData.itemId;
        if (!itemId) {
            return interaction.reply({ content: "❌ アイテム情報が見つかりません。", ephemeral: true });
        }

        const db = await readGuildDB();
        const item = db[guildId]?.items?.[itemId];

        if (!item) {
            return interaction.reply({
                content: "❌ このアイテムは存在しません。",
                ephemeral: true
            });
        }

        // 在庫チェック（ロールアイテムは無限）
        if (item.stock !== null && item.stock <= 0) {
            return interaction.reply({
                content: "❌ このアイテムは在庫切れです。",
                ephemeral: true
            });
        }

        // --- ユーザーの所持金 ---
        if (!db[guildId].users) db[guildId].users = {};
        if (!db[guildId].users[userId]) {
            db[guildId].users[userId] = { money: 0 };
        }

        const money = db[guildId].users[userId].money;

        if (money < item.sellPrice) {
            return interaction.reply({
                content: "❌ 所持金が足りません。",
                ephemeral: true
            });
        }

        // --- 購入処理 ---
        db[guildId].users[userId].money -= item.sellPrice;

        // 在庫があるタイプのみ減らす
        if (item.stock !== null) {
            item.stock -= 1;
        }

        await writeGuildDB(db);

        const embed = new EmbedBuilder()
            .setColor("#00ff9d")
            .setTitle("🛒 購入完了")
            .setDescription(`**${item.name}** を購入しました！`)
            .addFields(
                { name: "💰 残り所持金", value: `${db[guildId].users[userId].money}` }
            );

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
