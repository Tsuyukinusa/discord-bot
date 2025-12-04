// commands/admin/omikuji-config-set-weight.js
import { SlashCommandBuilder } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("omikuji-config-set-weight")
        .setDescription("運勢の確率（重み）を設定します（管理者専用）")
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
            opt.setName("weight")
                .setDescription("新しい確率（重み）")
                .setMinValue(1)
                .setRequired(true)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const result = interaction.options.getString("result");
        const weight = interaction.options.getInteger("weight");

        const db = await readGuildDB();
        if (!db[guildId] || !db[guildId].omikujiConfig) {
            return interaction.reply({
                content: "❌ まだ /omikuji-config-init が実行されていません。",
                ephemeral: true
            });
        }

        db[guildId].omikujiConfig.results[result].weight = weight;
        await writeGuildDB(db);

        return interaction.reply({
            content: `🔧 運勢 **${result}** の重みを **${weight}** に変更しました！`,
            ephemeral: false
        });
    }
};
