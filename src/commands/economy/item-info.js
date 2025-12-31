import {
    SlashCommandBuilder,
    EmbedBuilder
} from "discord.js";
import { readGuildDB } from "../../utils/core/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("item-info")
        .setDescription("指定したアイテムの詳細を表示します")
        .addStringOption(opt =>
            opt.setName("id")
                .setDescription("アイテムID")
                .setRequired(true)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const itemId = interaction.options.getString("id");

        const db = await readGuildDB();

        if (!db[guildId] || !db[guildId].items || !db[guildId].items[itemId]) {
            return interaction.reply({
                content: "❌ 指定されたアイテムは存在しません。",
                ephemeral: true
            });
        }

        const item = db[guildId].items[itemId];

        const typeNames = {
            xp: "XP増加",
            vxp: "VXP増加",
            role: "ロール付与",
            gacha: "ガチャダイヤ",
            pet: "ペット用アイテム"
        };

        const embed = new EmbedBuilder()
            .setColor("#2b8cff")
            .setTitle(`📦 アイテム情報：${item.name}`)
            .addFields(
                { name: "🆔 ID", value: itemId },
                { name: "🎨 作成者", value: `<@${item.creator}>` },
                { name: "📄 種類", value: typeNames[item.type] || item.type },
                { name: "📝 説明", value: item.description || "（なし）" }
            )
            .setFooter({ text: "アイテム詳細" })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
