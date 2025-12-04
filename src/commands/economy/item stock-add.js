import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} from "discord.js";

import { getGuild, updateGuild } from "../../utils/guildDB.js";
import { getUser, updateUser } from "../../utils/userdb.js";

export default {
    data: new SlashCommandBuilder()
        .setName("itm")
        .setDescription("アイテム関連コマンド")
        .addSubcommand(sub =>
            sub
                .setName("stock-add")
                .setDescription("アイテムの在庫を追加します")
                .addStringOption(opt =>
                    opt.setName("itemid")
                        .setDescription("アイテムID")
                        .setRequired(true)
                )
                .addIntegerOption(opt =>
                    opt.setName("amount")
                        .setDescription("追加する在庫数")
                        .setRequired(true)
                        .setMinValue(1)
                )
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        const itemId = interaction.options.getString("itemid");
        const addAmount = interaction.options.getInteger("amount");

        const guild = getGuild(guildId);
        if (!guild.items) guild.items = {};

        const item = guild.items[itemId];

        if (!item) {
            return interaction.reply({
                content: "❌ **そのアイテムIDは存在しません！**",
                ephemeral: true
            });
        }

        // ロール付与アイテムは在庫が無限のため追加の必要なし
        if (item.type === "role") {
            return interaction.reply({
                content: "⚠ このアイテムは **ロール付与タイプ** のため在庫を追加できません。（無限）",
                ephemeral: true
            });
        }

        // === 必要金額の計算 ===
        const cost = item.cost * addAmount;

        const user = getUser(guildId, userId);
        if (!user.money) user.money = 0;

        if (user.money < cost) {
            return interaction.reply({
                content: `❌ お金が足りません！\n必要金額: **${cost}**`,
                ephemeral: true
            });
        }

        // お金減らす
        user.money -= cost;
        updateUser(guildId, userId, user);

        // 在庫追加
        item.stock += addAmount;

        updateGuild(guildId, guild);

        // === 埋め込み ===
        const embed = new EmbedBuilder()
            .setTitle("📦 在庫追加完了")
            .setColor("#00ffae")
            .setDescription(`**${item.name}** の在庫を追加しました！`)
            .addFields(
                { name: "🆔 アイテムID", value: itemId, inline: true },
                { name: "➕ 追加数", value: `${addAmount}`, inline: true },
                { name: "💰 消費金額", value: `${cost}`, inline: true },
                { name: "📦 新しい在庫数", value: `${item.stock}`, inline: true }
            )
            .setFooter({ text: `${interaction.user.username} さんが実行` });

        return interaction.reply({ embeds: [embed] });
    }
};
