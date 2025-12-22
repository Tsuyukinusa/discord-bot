import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("stock-register")
        .setDescription("株式会社を登録します（管理者専用）")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(o =>
            o.setName("id")
                .setDescription("会社ID（英数字）")
                .setRequired(true)
        )
        .addStringOption(o =>
            o.setName("name")
                .setDescription("会社名")
                .setRequired(true)
        )
        .addIntegerOption(o =>
            o.setName("volatility")
                .setDescription("株価変動率（±%）")
                .setRequired(true)
                .setMinValue(1)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const id = interaction.options.getString("id");
        const name = interaction.options.getString("name");
        const volatility = interaction.options.getInteger("volatility");

        const db = await readGuildDB();
        if (!db[guildId]) db[guildId] = {};
        if (!db[guildId].stocks) db[guildId].stocks = {};

        if (db[guildId].stocks[id]) {
            return interaction.reply({
                content: "❌ その会社IDは既に存在します。",
                ephemeral: true
            });
        }

        db[guildId].stocks[id] = {
            name,
            volatility
        };

        await writeGuildDB(db);

        const embed = new EmbedBuilder()
            .setColor("#4b9aff")
            .setTitle("🏢 株式会社 登録完了")
            .addFields(
                { name: "ID", value: id },
                { name: "会社名", value: name },
                { name: "変動率", value: `±${volatility}%` }
            );

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};
