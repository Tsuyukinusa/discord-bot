import {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
} from "discord.js";
import { getGuild, updateGuild } from "../../utils/guildDB.js";

export default {
    data: new SlashCommandBuilder()
        .setName("item-create")
        .setDescription("新しいアイテムを作成します（誰でも使用可能）")
        .addStringOption(opt =>
            opt.setName("id")
                .setDescription("アイテムID（英数字）")
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName("name")
                .setDescription("アイテム名")
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName("description")
                .setDescription("アイテムの説明 / 効果を表す文章")
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName("type")
                .setDescription("アイテムタイプ")
                .setRequired(true)
                .addChoices(
                    { name: "XP増加", value: "xp" },
                    { name: "VXP増加", value: "vxp" },
                    { name: "ロール付与", value: "role" },
                    { name: "ガチャダイヤ", value: "gacha" },
                    { name: "ペット道具", value: "pet-item" }
                )
        )
        .addIntegerOption(opt =>
            opt.setName("price")
                .setDescription("売値（購入するときの値段）")
                .setRequired(true)
        )
        .addIntegerOption(opt =>
            opt.setName("cost")
                .setDescription("原価（在庫追加時の必要金額）※ロールは不要")
                .setRequired(false)
        )
        .addRoleOption(opt =>
            opt.setName("role")
                .setDescription("ロール付与アイテムの場合のみ設定")
                .setRequired(false)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const creator = interaction.user.id;

        const id = interaction.options.getString("id");
        const name = interaction.options.getString("name");
        const desc = interaction.options.getString("description");
        const type = interaction.options.getString("type");
        const price = interaction.options.getInteger("price");
        const cost = interaction.options.getInteger("cost") ?? null;
        const role = interaction.options.getRole("role");

        const db = getGuild(guildId);
        if (!db.items) db.items = {};

        // --- IDの重複チェック ---
        if (db.items[id]) {
            return interaction.reply({
                content: "❌ そのIDのアイテムは既に存在します！",
                ephemeral: true,
            });
        }

        // ==============================
        // ★ ロールアイテムの特別処理 ★
        // ==============================
        if (type === "role") {
            // 原価不要
            // 在庫無限
            // roleId は必須
            if (!role) {
                return interaction.reply({
                    content: "❌ ロール付与アイテムにはロールの指定が必要です！",
                    ephemeral: true,
                });
            }

            // 管理権限持ちロールは禁止
            const perms = role.permissions;
            if (
                perms.has(PermissionFlagsBits.Administrator) ||
                perms.has(PermissionFlagsBits.ManageGuild) ||
                perms.has(PermissionFlagsBits.ManageRoles)
            ) {
                return interaction.reply({
                    content: "❌ 管理権限を持つロールはアイテムにできません！",
                    ephemeral: true,
                });
            }

            db.items[id] = {
                id,
                name,
                description: desc,
                creator,
                type: "role",
                price,
                cost: null,
                roleId: role.id,
                stock: "∞", // 無限
            };
        }

        // ==============================
        // ★ 通常アイテム（xp / vxp / gacha / pet-item）
        // ==============================
        else {
            if (cost === null || cost < 0) {
                return interaction.reply({
                    content: "❌ このアイテムには原価（0以上）が必要です！",
                    ephemeral: true,
                });
            }

            db.items[id] = {
                id,
                name,
                description: desc,
                creator,
                type,
                price,
                cost,
                roleId: null,
                stock: 0,
            };
        }

        updateGuild(guildId, db);

        // ★ 完了埋め込み
        const embed = new EmbedBuilder()
            .setTitle("🛒 アイテムを作成しました！")
            .setColor("#00ffb7")
            .addFields(
                { name: "🪪 ID", value: id },
                { name: "📛 名前", value: name },
                { name: "📘 説明", value: desc },
                { name: "📂 タイプ", value: type },
                { name: "💵 売値", value: `${price}` },
                {
                    name: "🏗 原価",
                    value: type === "role" ? "なし（ロールは無限）" : `${cost}`,
                },
                { name: "📦 在庫", value: type === "role" ? "∞" : "0" }
            )
            .setFooter({ text: `作成者：${interaction.user.username}` });

        return interaction.reply({ embeds: [embed] });
    },
};
