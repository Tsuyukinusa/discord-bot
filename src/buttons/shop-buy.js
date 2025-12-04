// buttons/shop-buy.js
import { EmbedBuilder } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
    customId: /^shop-buy-.+$/, // ← shop-buy-◯◯ 形式にマッチ

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

        // --- 在庫チェック（ロール以外） ---
        if (item.type !== "role") {
            if (item.stock <= 0) {
                return interaction.reply({
                    content: "❌ 在庫切れです！",
                    ephemeral: true
                });
            }
        }

        // ★ コインや通貨処理は後で追加できる

        // --- 在庫減らす（ロール以外） ---
        if (item.type !== "role") {
            item.stock -= 1;
        }

        await writeGuildDB(db);

        // --- 購入成功メッセージ（本人にだけ見える） ---
        const embed = new EmbedBuilder()
            .setColor("#00ff8c")
            .setTitle("🛒 購入完了！")
            .setDescription(`**${item.name}** を購入しました！`)
            .setFooter({ text: "購入内容はあなただけに表示されています。" });

        return interaction.reply({
            embeds: [embed],
            ephemeral: true  // ← これで本人だけに見える！
        });
    }
};
