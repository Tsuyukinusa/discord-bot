import {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("item-create")
        .setDescription("新しいアイテムを作成します（誰でも使用可能）")
        .addStringOption(opt =>
            opt.setName("name")
                .setDescription("アイテム名")
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName("id")
                .setDescription("アイテムID（英数字）")
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName("description")
                .setDescription("効果説明文")
                .setRequired(true)
        )

        // ★追加：効果発動時のメッセージ
        .addStringOption(opt => 
            opt.setName("effectmessage")
                .setDescription("効果が発動した時に表示されるメッセージ")
                .setRequired(true)   // ここは必要なら false にしてもいい
        ) // ← ★追加

        .addStringOption(opt =>
            opt.setName("type")
                .setDescription("アイテムの種類")
                .setRequired(true)
                .addChoices(
                    { name: "XP増加", value: "xp" },
                    { name: "VXP増加", value: "vxp" },
                    { name: "ロール付与", value: "role" },
                    { name: "ガチャダイヤ", value: "gacha" }
                )
        )
        .addIntegerOption(opt =>
            opt.setName("sellprice")
                .setDescription("売値")
                .setRequired(true)
                .setMinValue(0)
        )
        .addIntegerOption(opt =>
            opt.setName("cost")
                .setDescription("原価（ロール以外必須）")
                .setRequired(false)
        )
        .addIntegerOption(opt =>
            opt.setName("effect")
                .setDescription("効果量（数字）")
                .setRequired(true)
        )
        .addRoleOption(opt =>
            opt.setName("role")
                .setDescription("ロール付与アイテムなら設定")
                .setRequired(false)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        const name = interaction.options.getString("name");
        const itemId = interaction.options.getString("id");
        const description = interaction.options.getString("description");

        const effectMessage = interaction.options.getString("effectmessage"); // ← ★追加

        const type = interaction.options.getString("type");
        const sellPrice = interaction.options.getInteger("sellprice");
        const cost = interaction.options.getInteger("cost");
        const effectValue = interaction.options.getInteger("effect");
        const role = interaction.options.getRole("role");

        const db = await readGuildDB();

        if (!db[guildId]) db[guildId] = {};
        if (!db[guildId].items) db[guildId].items = {};

        if (db[guildId].items[itemId]) {
            return interaction.reply({
                content: "❌ そのアイテムIDはすでに使われています。",
                ephemeral: true
            });
        }

        if (type === "role") {
            if (!role) {
                return interaction.reply({
                    content: "❌ ロール付与アイテムにはロールを指定してください。",
                    ephemeral: true
                });
            }

            if (
                role.permissions.has(PermissionFlagsBits.Administrator) ||
                role.permissions.has(PermissionFlagsBits.ManageGuild) ||
                role.managed === true
            ) {
                return interaction.reply({
                    content: "❌ 管理者・特別ロールは付与できません。",
                    ephemeral: true
                });
            }
        }

        if (type !== "role") {
            if (cost === null || cost < 0) {
                return interaction.reply({
                    content: "❌ 原価が必要です（0以上）。",
                    ephemeral: true
                });
            }
        }

        // ★保存データに effectMessage を追加
        db[guildId].items[itemId] = {
            name,
            description,
            effectMessage, // ← ★追加
            type,
            sellPrice,
            cost: type === "role" ? null : cost,
            stock: type === "role" ? null : 0,
            effectValue,
            roleId: type === "role" ? role.id : null,
            creator: userId,
            createdAt: Date.now()
        };

        await writeGuildDB(db);

        const embed = new EmbedBuilder()
            .setColor("#00ff9d")
            .setTitle("🛠 アイテム作成完了")
            .addFields(
                { name: "📝 名前", value: name },
                { name: "🆔 ID", value: itemId },
                { name: "📄 説明", value: description },
                { name: "🎬 発動メッセージ", value: effectMessage }, // ← ★追加
                { name: "🔧 種類", value: type },
                { name: "💰 売値", value: `${sellPrice}` },
                { name: "💵 原価", value: type === "role" ? "なし（ロールは無限）" : `${cost}` },
                { name: "✨ 効果値", value: `${effectValue}` },
                { name: "🎨 クリエイター", value: `<@${userId}>` }
            );

        if (type === "role") {
            embed.addFields({ name: "🎖 付与ロール", value: `<@&${role.id}>` });
        }

        return interaction.reply({ embeds: [embed] });
    }
};
