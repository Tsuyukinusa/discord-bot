// commands/admin/stock-register.js
import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("stock-register")
        .setDescription("株式会社を登録します（管理者専用）")
        .addStringOption(opt =>
            opt.setName("id")
                .setDescription("会社ID（英数字・内部用）")
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName("name")
                .setDescription("株式会社名")
                .setRequired(true)
        )
        .addIntegerOption(opt =>
            opt.setName("price")
                .setDescription("初期株価")
                .setRequired(true)
                .setMinValue(1)
        )
        .addIntegerOption(opt =>
            opt.setName("volatility")
                .setDescription("株価変動率（±%）")
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const id = interaction.options.getString("id");
        const name = interaction.options.getString("name");
        const price = interaction.options.getInteger("price");
        const volatility = interaction.options.getInteger("volatility");

        const db = await readGuildDB();
        if (!db[guildId]) db[guildId] = {};
        if (!db[guildId].stocks) db[guildId].stocks = {};

        if (db[guildId].stocks[id]) {
            return interaction.reply({
                content: "❌ その会社IDはすでに存在します。",
                ephemeral: true
            });
        }

        db[guildId].stocks[id] = {
            name,
            basePrice: price,
            volatility,
            createdAt: Date.now()
        };

        await writeGuildDB(db);

        const embed = new EmbedBuilder()
            .setColor("#4caf50")
            .setTitle("🏢 株式会社を登録しました")
            .addFields(
                { name: "🆔 会社ID", value: id },
                { name: "📛 会社名", value: name },
                { name: "💰 初期株価", value: `${price}` },
                { name: "📈 変動率", value: `±${volatility}%` }
            );

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};
