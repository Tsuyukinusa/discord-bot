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

        if (!db[guildId]?.items) {
            return interaction.reply({
                content: "❌ このサーバーにはアイテムが登録されていません。",
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

        // --- ユーザー初期化 ---
        if (!db[guildId].users) db[guildId].users = {};
        if (!db[guildId].users[userId]) {
            db[guildId].users[userId] = {
                balance: 0,
                inventory: {},
                stocks: {}
            };
        }

        const user = db[guildId].users[userId];
        if (typeof user.balance !== "number") user.balance = 0;
        if (!user.inventory) user.inventory = {};

        const currency = db[guildId].currency?.symbol ?? "¥";

        // ================================
        // 🎖 ロールアイテム処理
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

            const member = interaction.member;

            if (member.roles.cache.has(roleId)) {
                return interaction.reply({
                    content: "❌ あなたはすでにこのロールを持っています。",
                    ephemeral: true
                });
            }

            if (user.balance < item.cost) {
                return interaction.reply({
                    content: `❌ 所持金が足りません。（必要: ${currency}${item.cost}）`,
                    ephemeral: true
                });
            }

            // 💰 支払い
            user.balance -= item.cost;

            // 🎖 ロール付与
            await member.roles.add(roleId);

            await writeGuildDB(db);

            const embed = new EmbedBuilder()
                .setColor("#00ff9d")
                .setTitle("🎖 ロール購入完了")
                .setDescription(`ロール **${role.name}** を付与しました！`)
                .addFields(
                    { name: "消費金額", value: `${currency}${item.cost}`, inline: true },
                    { name: "残り所持金", value: `${currency}${user.balance}`, inline: true }
                )
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        // ================================
        // 🛒 通常アイテム購入処理
        // ================================
        const totalCost = item.cost * amount;

        if (user.balance < totalCost) {
            return interaction.reply({
                content: `❌ 所持金が足りません。（必要: ${currency}${totalCost}）`,
                ephemeral: true
            });
        }

        if (typeof item.stock === "number" && item.stock < amount) {
            return interaction.reply({
                content: `❌ 在庫が不足しています。（現在: ${item.stock}）`,
                ephemeral: true
            });
        }

        // 購入処理
        user.balance -= totalCost;
        if (typeof item.stock === "number") item.stock -= amount;

        user.inventory[itemId] = (user.inventory[itemId] || 0) + amount;

        await writeGuildDB(db);

        const embed = new EmbedBuilder()
            .setColor("#00aaff")
            .setTitle("🛒 アイテム購入完了")
            .addFields(
                { name: "アイテム", value: `${item.name} × ${amount}` },
                { name: "消費金額", value: `${currency}${totalCost}` },
                { name: "残り所持金", value: `${currency}${user.balance}` },
                {
                    name: "在庫",
                    value: typeof item.stock === "number" ? `${item.stock}` : "∞"
                }
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
