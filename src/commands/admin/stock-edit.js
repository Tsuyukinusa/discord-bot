import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";

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
            o.setName("min")
                .setDescription("変動率の最小値（%）（省略可）")
                .setRequired(false)
                .setMinValue(0)
        )
        .addIntegerOption(o =>
            o.setName("max")
                .setDescription("変動率の最大値（%）（省略可）")
                .setRequired(false)
                .setMinValue(1)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const id = interaction.options.getString("id");
        const name = interaction.options.getString("name");
        const min = interaction.options.getInteger("min");
        const max = interaction.options.getInteger("max");

        const db = await readGuildDB();
        const stock = db[guildId]?.stocks?.[id];

        if (!stock) {
            return interaction.reply({
                content: "❌ その会社は存在しません。",
                ephemeral: true
            });
        }

        // 名前変更
        if (name !== null) stock.name = name;

        // 変動率変更
        if (min !== null || max !== null) {
            if (!stock.volatility) {
                stock.volatility = { min: 1, max: 1 };
            }

            const newMin = min ?? stock.volatility.min;
            const newMax = max ?? stock.volatility.max;

            if (newMin > newMax) {
                return interaction.reply({
                    content: "❌ 最小値は最大値以下にしてください。",
                    ephemeral: true
                });
            }

            stock.volatility.min = newMin;
            stock.volatility.max = newMax;
        }

        await writeGuildDB(db);

        const embed = new EmbedBuilder()
            .setColor("#ffd43b")
            .setTitle("✏️ 株式会社 設定変更")
            .addFields(
                { name: "ID", value: id },
                { name: "会社名", value: stock.name },
                {
                    name: "変動率",
                    value: `±${stock.volatility.min}% 〜 ±${stock.volatility.max}%`
                }
            );

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};
