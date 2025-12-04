// commands/admin/omikuji-config-add-item-reward.js
import { SlashCommandBuilder } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("omikuji-config-add-item-reward")
        .setDescription("報酬アイテムを追加します")
        .addStringOption(o =>
            o.setName("result")
                .setDescription("対象運勢")
                .setRequired(true)
                .addChoices(
                    { name: "大吉", value: "daikichi" },
                    { name: "中吉", value: "tyuukichi" },
                    { name: "小吉", value: "syoukichi" },
                    { name: "吉", value: "kichi" },
                    { name: "末吉", value: "suekichi" },
                    { name: "凶", value: "kyou" },
                    { name: "大凶", value: "daikyou" },
                    { name: "極凶", value: "gokukyou" }
                )
        )
        .addStringOption(o =>
            o.setName("itemid")
                .setDescription("追加するアイテムID")
                .setRequired(true)
        )
        .addIntegerOption(o =>
            o.setName("amount")
                .setDescription("付与数")
                .setRequired(true)
                .setMinValue(1)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;

        const resultId = interaction.options.getString("result");
        const itemId = interaction.options.getString("itemid");
        const amount = interaction.options.getInteger("amount");

        const db = await readGuildDB();

        if (!db[guildId] || !db[guildId].omikujiConfig) {
            return interaction.reply({
                content: "❌ 設定がありません。",
                ephemeral: true
            });
        }

        db[guildId].omikujiConfig.results[resultId].rewards.items.push({
            id: itemId,
            amount
        });

        await writeGuildDB(db);

        return interaction.reply({
            content: `📦 報酬アイテム **${itemId} x${amount}** を追加しました！`,
            ephemeral: false
        });
    }
};
