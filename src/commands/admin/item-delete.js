import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("item-delete")
        .setDescription("アイテムを削除します（作成者 or 管理者のみ）")
        .addStringOption(opt =>
            opt.setName("itemid")
                .setDescription("削除するアイテムID")
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(50)
        ),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({
                content: "❌ サーバー内でのみ使用できます。",
                ephemeral: true,
            });
        }
    
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;
        const itemId = interaction.options.getString("itemid");
    
        // ✅ 全Guild DBを取得
        const guildDB = await readGuildDB();
    
        // ✅ 対象Guild
        const guild = guildDB[guildId];
    
        if (!guild || !guild.items || !guild.items[itemId]) {
            return interaction.reply({
                content: "❌ そのアイテムIDは存在しません。",
                ephemeral: true,
            });
        }
    
        const item = guild.items[itemId];
    
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        const isCreator = item.creatorId === userId;
    
        if (!isAdmin && !isCreator) {
            return interaction.reply({
                content: "❌ このアイテムを削除できるのは **作成者** または **管理者** のみです。",
                ephemeral: true,
            });
        }
    
        // ✅ 削除
        delete guild.items[itemId];
    
        // ✅ 全体を書き戻す
        guildDB[guildId] = guild;
        await writeGuildDB(guildDB);
    
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
