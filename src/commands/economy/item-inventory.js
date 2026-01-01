import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getUser, getGuild } from "../../utils/core/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("inventory")
        .setDescription("あなたの所持アイテムを表示します"),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        // --- データ取得 ---
        const user = getUser(guildId, userId);
        const guild = getGuild(guildId);

        // 安全初期化
        if (!user.inventory) user.inventory = {};
        if (!guild.items) guild.items = {};

        // インベントリ空チェック
        if (Object.keys(user.inventory).length === 0) {
            const emptyEmbed = new EmbedBuilder()
                .setTitle("🎒 インベントリ")
                .setColor("#ffb6c1")
                .setDescription("所持アイテムがありません。")
                .setTimestamp();

            return interaction.reply({
                embeds: [emptyEmbed],
                ephemeral: true
            });
        }

        // --- 表示用テキスト生成 ---
        let list = "";
        for (const itemId in user.inventory) {
            const count = user.inventory[itemId];
            const item = guild.items[itemId];

            if (!item) continue; // 削除済みアイテムは無視

            list += `**${item.name}** × ${count}\n`;
        }

        if (!list) list = "所持アイテムがありません。";

        const embed = new EmbedBuilder()
            .setTitle(`🎒 ${interaction.user.username} のインベントリ`)
            .setColor("#00aaff")
            .setDescription(list)
            .setTimestamp();

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};
