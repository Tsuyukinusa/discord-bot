import {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits
} from "discord.js";
import { getGuild, updateGuild } from "../../utils/core/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("item-edit")
        .setDescription("アイテム情報を変更します（管理者 or 作成者）")
        .addStringOption(opt =>
            opt.setName("id")
                .setDescription("編集するアイテムID")
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName("name")
                .setDescription("新しいアイテム名（任意）")
        )
        .addIntegerOption(opt =>
            opt.setName("sell")
                .setDescription("新しい売値（任意）")
        )
        .addStringOption(opt =>
            opt.setName("effect")
                .setDescription("新しい効果（任意）")
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;
        const id = interaction.options.getString("id");

        const newName = interaction.options.getString("name");
        const newSell = interaction.options.getInteger("sell");
        const newEffect = interaction.options.getString("effect");

        const guild = getGuild(guildId);

        if (!guild.items || !guild.items[id]) {
            return interaction.reply({
                content: "❌ そのIDのアイテムは存在しません。",
                ephemeral: true
            });
        }

        const item = guild.items[id];

        // ================================
        // 🔒 権限チェック
        // 管理者 or 作成者のみ
        // ================================
        const isAdmin = interaction.member.permissions.has(
            PermissionFlagsBits.ManageGuild
        );
        const isCreator = item.creator === userId;

        if (!isAdmin && !isCreator) {
            return interaction.reply({
                content: "❌ このアイテムを編集できるのは管理者または作成者のみです。",
                ephemeral: true
            });
        }

        // ================================
        // ✏ 編集処理
        // ================================
        if (newName) item.name = newName;
        if (newSell !== null) item.sellPrice = newSell;
        if (newEffect) item.effectMessage = newEffect;

        updateGuild(guildId, guild);

        const embed = new EmbedBuilder()
            .setTitle("🛠 アイテムを更新しました")
            .setColor("#00ff88")
            .addFields(
                { name: "🆔 ID", value: id, inline: true },
                { name: "📛 名前", value: item.name, inline: true },
                { name: "💰 売値", value: String(item.sellPrice), inline: true },
                {
                    name: "🎬 効果メッセージ",
                    value: item.effectMessage || "なし",
                    inline: false
                }
            )
            .setTimestamp();

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};
