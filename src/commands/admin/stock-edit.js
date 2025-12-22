import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("stock-edit")
        .setDescription("株式会社の設定を変更します（管理者専用）")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(o =>
            o.setName("id")
                .setDescription("会社ID")
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("name")
                .setDescription("新しい会社名（省略可）")
                .setRequired(false)
        )
        .addIntegerOption(o =>
            o.setName("volatility")
                .setDescription("新しい変動率（±%）（省略可）")
                .setRequired(false)
                .setMinValue(1)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const id = interaction.options.getString("id");
        const name = interaction.options.getString("name");
        const volatility = interaction.options.getInteger("volatility");

        const db = await readGuildDB();
        const stock = db[guildId]?.stocks?.[id];

        if (!stock) {
            return interaction.reply({
                content: "❌ その会社は存在しません。",
                ephemeral: true
            });
        }

        if (name !== null) stock.name = name;
        if (volatility !== null) stock.volatility = volatility;

        await writeGuildDB(db);

        const embed = new EmbedBuilder()
            .setColor("#ffd43b")
            .setTitle("✏️ 株式会社 設定変更")
            .addFields(
                { name: "ID", value: id },
                { name: "会社名", value: stock.name },
                { name: "変動率", value: `±${stock.volatility}%` }
            );

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
}; 
