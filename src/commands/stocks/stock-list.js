import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { readGuildDB } from "../../utils/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("stock-list")
        .setDescription("登録されている株式会社一覧を表示します"),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const db = await readGuildDB();

        if (!db[guildId] || !db[guildId].stocks || Object.keys(db[guildId].stocks).length === 0) {
            return interaction.reply({
                content: "📉 まだ株式会社が登録されていません。",
                ephemeral: false
            });
        }

        const embed = new EmbedBuilder()
            .setTitle("📈 株式会社一覧")
            .setColor("#4b9aff")
            .setDescription("現在登録されている株式会社です");

        for (const [stockId, stock] of Object.entries(db[guildId].stocks)) {
            embed.addFields({
                name: `🏢 ${stock.name}`,
                value:
                    `🆔 ID: \`${stockId}\`\n` +
                    `📊 変動率: **${stock.volatility}%**`,
                inline: false
            });
        }

        return interaction.reply({
            embeds: [embed],
            ephemeral: false
        });
    }
};
