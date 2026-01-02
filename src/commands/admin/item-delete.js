import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { getGuild, updateGuild } from "../../utils/core/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("item-delete")
        .setDescription("アイテムを削除します（作成者 or 管理者のみ）")
        .addStringOption(opt =>
            opt.setName("itemid")
                .setDescription("削除するアイテムID")
                .setRequired(true)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;
        const itemId = interaction.options.getString("itemid");

        const guild = getGuild(guildId);

        // --- アイテムが存在しない ---
        if (!guild.items || !guild.items[itemId]) {
            return interaction.reply({
                content: "❌ そのアイテムIDは存在しません。",
                ephemeral: true,
            });
        }

        const item = guild.items[itemId];

        // --- 管理者かどうか ---
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

        // --- 作成者かどうか ---
        const isCreator = item.creatorId === userId;

        // --- 権限チェック ---
        if (!isAdmin && !isCreator) {
            return interaction.reply({
                content: "❌ このアイテムを削除できるのは **作成者** または **管理者** のみです。",
                ephemeral: true,
            });
        }

        // --- アイテム削除 ---
        delete guild.items[itemId];
        updateGuild(guildId, guild);

        // --- 埋め込み ---
        const embed = new EmbedBuilder()
            .setTitle("🗑️ アイテム削除")
            .setColor("#ff6666")
            .setDescription(`アイテム **${item.name}**（ID: \`${itemId}\`）を削除しました。`)
            .addFields(
                { name: "削除者", value: `<@${userId}>`, inline: true },
                { name: "作成者", value: `<@${item.creatorId}>`, inline: true }
            );

        return interaction.reply({ embeds: [embed] });
    }
};
