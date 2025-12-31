// buttons/shop-buy.js
import { EmbedBuilder } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";

export default {
    customId: /^shop-buy-.+$/, // shop-buy-◯◯ にマッチ

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        // --- itemId の抽出 ---
        const [, itemId] = interaction.customId.split("shop-buy-");

        const db = await readGuildDB();

        if (!db[guildId] || !db[guildId].items[itemId]) {
            return interaction.reply({
                content: "❌ このアイテムは存在しません。",
                ephemeral: true
            });
        }

        const item = db[guildId].items[itemId];

        // --- ユーザーデータ ---
        if (!db[guildId].users) db[guildId].users = {};
        if (!db[guildId].users[userId]) {
            db[guildId].users[userId] = {
                coins: 0,
                inventory: {}
            };
        }

        const userData = db[guildId].users[userId];

        // --- 通貨チェック ---
        if (userData.coins < item.sellPrice) {
            return interaction.reply({
                content: `❌ 所持金が足りません！（必要: ${item.sellPrice}）`,
                ephemeral: true
            });
        }

        // --- 在庫チェック（ロールは無限） ---
        if (item.type !== "role" && item.stock <= 0) {
            return interaction.reply({
                content: "❌ 在庫切れです！",
                ephemeral: true
            });
        }

        // --- 購入処理 ---
        userData.coins -= item.sellPrice;

        // --- 在庫減少（ロール以外） ---
        if (item.type !== "role") {
            item.stock -= 1;
        }

        // --- インベントリへ追加 ---
        if (!userData.inventory[itemId]) {
            userData.inventory[itemId] = 0;
        }
        userData.inventory[itemId] += 1;

        await writeGuildDB(db);

        // --- メッセージ ---
        const embed = new EmbedBuilder()
            .setColor("#00ff8c")
            .setTitle("🛒 購入完了！")
            .setDescription(`**${item.name}** を購入してインベントリに追加しました！`)
            .addFields(
                { name: "現在の所持金", value: `${userData.coins} コイン` }
            )
            .setFooter({ text: "このメッセージはあなただけに見えます。" });

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};
