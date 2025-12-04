import { SlashCommandBuilder } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("omikuji-config-remove-item")
        .setDescription("おみくじの報酬アイテムを削除します（管理者専用）")
        .addStringOption(opt =>
            opt.setName("result")
                .setDescription("運勢キー（例: daikichi, gokukyou）")
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName("itemid")
                .setDescription("削除するアイテムID")
                .setRequired(true)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const resultKey = interaction.options.getString("result");
        const itemId = interaction.options.getString("itemid");

        const db = await readGuildDB();
        if (!db[guildId] || !db[guildId].omikujiConfig)
            return interaction.reply("❌ 設定がありません。");

        const result = db[guildId].omikujiConfig.results[resultKey];
        if (!result) return interaction.reply("❌ その運勢は存在しません。");

        result.rewards.items = result.rewards.items.filter(i => i.id !== itemId);

        await writeGuildDB(db);

        return interaction.reply(`🗑️ **${result.name}** からアイテム **${itemId}** を削除しました。`);
    }
};
