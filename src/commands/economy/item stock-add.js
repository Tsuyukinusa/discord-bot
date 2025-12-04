import {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("item-stock-add")
        .setDescription("アイテムの在庫を追加します")
        .addStringOption(opt =>
            opt.setName("id")
                .setDescription("アイテムID")
                .setRequired(true)
        )
        .addIntegerOption(opt =>
            opt.setName("amount")
                .setDescription("追加する数量")
                .setRequired(true)
                .setMinValue(1)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        const itemId = interaction.options.getString("id");
        const amount = interaction.options.getInteger("amount");

        const db = await readGuildDB();
        if (!db[guildId] || !db[guildId].items || !db[guildId].items[itemId]) {
            return interaction.reply({
                content: "❌ そのアイテムは存在しません。",
                ephemeral: true
            });
        }

        const item = db[guildId].items[itemId];

        // ロールアイテムは在庫無限なので在庫追加不可
        if (item.type === "role") {
            return interaction.reply({
                content: "❌ ロール付与アイテムには在庫の概念がありません。",
                ephemeral: true
            });
        }

        // 権限チェック：管理者 or 作成者のみ
        if (
            !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild) &&
            item.creator !== userId
        ) {
            return interaction.reply({
                content: "❌ このアイテムの作成者、または管理権限を持つユーザーのみ在庫を追加できます。",
                ephemeral: true
            });
        }

        // 原価計算
        const costTotal = item.cost * amount;

        // お金が足りるかチェック
        if (!db[guildId].users) db[guildId].users = {};
        if (!db[guildId].users[userId]) db[guildId].users[userId] = { money: 0 };

        const userMoney = db[guildId].users[userId].money;

        if (userMoney < costTotal) {
            return interaction.reply({
                content: `❌ 所持金が足りません。必要金額：${costTotal}`,
                ephemeral: true
            });
        }

        // お金を引く
        db[guildId].users[userId].money -= costTotal;

        // 在庫追加
        item.stock += amount;

        await writeGuildDB(db);

        // 返信
        const embed = new EmbedBuilder()
            .setColor("#4b9aff")
            .setTitle("📦 在庫追加完了")
            .addFields(
                { name: "🆔 アイテムID", value: itemId },
                { name: "📄 名前", value: item.name },
                { name: "➕ 追加数", value: `${amount}` },
                { name: "💵 消費金額", value: `${costTotal}` },
                { name: "📦 現在の在庫", value: `${item.stock}` }
            );

        return interaction.reply({ embeds: [embed] });
    }
};
