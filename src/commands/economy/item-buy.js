import {
    SlashCommandBuilder,
    EmbedBuilder
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("item-buy")
        .setDescription("アイテムを購入します")
        .addStringOption(opt =>
            opt.setName("id")
                .setDescription("購入するアイテムID")
                .setRequired(true)
        )
        .addIntegerOption(opt =>
            opt.setName("amount")
                .setDescription("購入数（ロールは1固定）")
                .setMinValue(1)
                .setRequired(false)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        const itemId = interaction.options.getString("id");
        const amount = interaction.options.getInteger("amount") ?? 1;

        const db = await readGuildDB();

        if (!db[guildId] || !db[guildId].items) {
            return interaction.reply({
                content: "❌ このサーバーにはアイテムがありません。",
                ephemeral: true
            });
        }

        const item = db[guildId].items[itemId];

        if (!item) {
            return interaction.reply({
                content: "❌ 指定したアイテムは存在しません。",
                ephemeral: true
            });
        }

        // ユーザーの所持金とインベントリを初期化
        if (!db[guildId].users) db[guildId].users = {};
        if (!db[guildId].users[userId]) {
            db[guildId].users[userId] = {
                money: 0,
                inventory: {}
            };
        }

        const user = db[guildId].users[userId];

        // ================================
        // 🔹 ロール付与アイテム特別処理
        // ================================
        if (item.type === "role") {
            const roleId = item.roleId;
            const role = interaction.guild.roles.cache.get(roleId);

            if (!role) {
                return interaction.reply({
                    content: "❌ このロールは現在存在しません。",
                    ephemeral: true
                });
            }

            // すでにロールを持っている
            const member = interaction.member;
            if (member.roles.cache.has(roleId)) {
                return interaction.reply({
                    content: "❌ あなたはすでにこのロールを持っています。",
                    ephemeral: true
                });
            }

            // キャッシュバック（売値返金）
            user.balance += item.sellPrice;

            await member.roles.add(roleId);

            await writeGuildDB(db);

            const embed = new EmbedBuilder()
                .setColor("#00ff9d")
                .setTitle("🎖 ロールアイテム購入")
                .setDescription(`ロール **${role.name}** を付与しました！`)
                .addFields(
                    { name: "返金額", value: `${item.sellPrice} コイン`, inline: true },
                    { name: "あなたの新しい所持金", value: `${user.balance} コイン`, inline: true }
                );

            return interaction.reply({ embeds: [embed] });
        }

        // ================================
        // 🔹 通常アイテム購入処理
        // ================================

        const totalCost = item.cost * amount;

        if (user.balance < totalCost) {
            return interaction.reply({
                content: `❌ 所持金が足りません。必要: ${totalCost}コイン`,
                ephemeral: true
            });
        }

        if (item.stock < amount) {
            return interaction.reply({
                content: `❌ 在庫が不足しています（現在: ${item.stock}）`,
                ephemeral: true
            });
        }

        // 購入処理
        user.balance -= totalCost;
        item.stock -= amount;

        if (!user.inventory[itemId]) user.inventory[itemId] = 0;
        user.inventory[itemId] += amount;

        await writeGuildDB(db);

        // 埋め込み返す
        const embed = new EmbedBuilder()
            .setColor("#00aaff")
            .setTitle("🛒 アイテム購入完了！")
            .addFields(
                { name: "アイテム", value: `${item.name} × ${amount}` },
                { name: "消費金額", value: `${totalCost} コイン` },
                { name: "残り所持金", value: `${user.money} コイン` },
                { name: "在庫", value: `${item.stock}` }
            );

        return interaction.reply({ embeds: [embed] });
    }
};
