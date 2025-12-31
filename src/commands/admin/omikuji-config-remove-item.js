import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("omikuji-config-set-reward")
        .setDescription("運勢の報酬（お金 / XP / ダイヤ）を変更します")
        .addStringOption(opt =>
            opt.setName("result")
                .setDescription("編集する運勢ID")
                .setRequired(true)
                .addChoices(
                    { name: "大吉", value: "daikichi" },
                    { name: "中吉", value: "tyuukichi" },
                    { name: "小吉", value: "syoukichi" },
                    { name: "吉", value: "kichi" },
                    { name: "末吉", value: "suekichi" },
                    { name: "凶", value: "kyou" },
                    { name: "大凶", value: "daikyou" },
                    { name: "極凶", value: "gokukyou" },
                )
        )
        .addIntegerOption(opt =>
            opt.setName("money").setDescription("お金（省略可能）")
        )
        .addIntegerOption(opt =>
            opt.setName("xp").setDescription("XP（省略可能）")
        )
        .addIntegerOption(opt =>
            opt.setName("diamond").setDescription("ダイヤ（省略可能）")
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const result = interaction.options.getString("result");

        const money = interaction.options.getInteger("money");
        const xp = interaction.options.getInteger("xp");
        const diamond = interaction.options.getInteger("diamond");

        const db = await readGuildDB();
        if (!db[guildId] || !db[guildId].omikujiConfig) {
            return interaction.reply({
                content: "❌ おみくじ設定がありません。",
                ephemeral: true
            });
        }

        const res = db[guildId].omikujiConfig.results[result].rewards;

        if (money !== null) res.money = money;
        if (xp !== null) res.xp = xp;
        if (diamond !== null) res.diamond = diamond;

        await writeGuildDB(db);

        const embed = new EmbedBuilder()
            .setTitle("💰 報酬を更新しました")
            .addFields(
                { name: "Money", value: `${res.money}`, inline: true },
                { name: "XP", value: `${res.xp}`, inline: true },
                { name: "Diamond", value: `${res.diamond}`, inline: true },
            )
            .setColor("#00c8ff");

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
