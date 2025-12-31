import {
    SlashCommandBuilder,
    EmbedBuilder
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("item-give")
        .setDescription("アイテムを他のユーザーに渡します（誰でも使用可）")
        .addUserOption(opt =>
            opt.setName("target")
                .setDescription("渡す相手")
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName("itemid")
                .setDescription("渡すアイテムID")
                .setRequired(true)
        )
        .addIntegerOption(opt =>
            opt.setName("amount")
                .setDescription("渡す数量")
                .setRequired(true)
                .setMinValue(1)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const senderId = interaction.user.id;
        const target = interaction.options.getUser("target");
        const itemId = interaction.options.getString("itemid");
        const amount = interaction.options.getInteger("amount");

        if (target.id === senderId) {
            return interaction.reply({
                content: "❌ 自分自身には渡せません！",
                ephemeral: true
            });
        }

        const db = await readGuildDB();

        if (!db[guildId] || !db[guildId].items) {
            return interaction.reply({ content: "❌ アイテムデータがありません。", ephemeral: true });
        }

        const item = db[guildId].items[itemId];

        if (!item) {
            return interaction.reply({ content: "❌ そのIDのアイテムは存在しません。", ephemeral: true });
        }

        // ロール付与アイテムは give 不可（在庫が存在しないため）
        if (item.type === "role") {
            return interaction.reply({
                content: "❌ ロール付与アイテムは譲渡できません。",
                ephemeral: true
            });
        }

        // ユーザーデータ初期化
        if (!db[guildId].users) db[guildId].users = {};
        if (!db[guildId].users[senderId]) db[guildId].users[senderId] = { inventory: {} };
        if (!db[guildId].users[target.id]) db[guildId].users[target.id] = { inventory: {} };

        const senderInv = db[guildId].users[senderId].inventory;
        const targetInv = db[guildId].users[target.id].inventory;

        if (!senderInv[itemId] || senderInv[itemId] < amount) {
            return interaction.reply({
                content: "❌ 渡すための在庫が足りません。",
                ephemeral: true
            });
        }

        // 在庫処理
        senderInv[itemId] -= amount;
        if (senderInv[itemId] <= 0) delete senderInv[itemId];

        if (!targetInv[itemId]) targetInv[itemId] = 0;
        targetInv[itemId] += amount;

        await writeGuildDB(db);

        const embed = new EmbedBuilder()
            .setColor("#4ae0ff")
            .setTitle("📦 アイテムを渡しました")
            .addFields(
                { name: "📤 送り主", value: `<@${senderId}>`, inline: true },
                { name: "📥 受取主", value: `<@${target.id}>`, inline: true },
                { name: "🎁 アイテム", value: `${item.name}（ID: ${itemId}）`, inline: false },
                { name: "🔢 数量", value: `${amount}`, inline: true }
            );

        return interaction.reply({ embeds: [embed] });
    }
};
