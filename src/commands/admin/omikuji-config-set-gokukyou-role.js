import { SlashCommandBuilder } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("omikuji-config-set-gokukyou-role")
        .setDescription("極凶ロール設定を追加または更新します（管理者専用）")
        .addIntegerOption(opt =>
            opt.setName("count")
                .setDescription("極凶を引いた回数")
                .setRequired(true)
                .setMinValue(1)
        )
        .addRoleOption(opt =>
            opt.setName("role")
                .setDescription("付与するロール")
                .setRequired(true)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const count = interaction.options.getInteger("count");
        const role = interaction.options.getRole("role");

        const db = await readGuildDB();
        if (!db[guildId] || !db[guildId].omikujiConfig)
            return interaction.reply("❌ 設定がありません。");

        db[guildId].omikujiConfig.gokukyouRoleRewards[count] = role.id;

        await writeGuildDB(db);

        return interaction.reply(
            `✨ 極凶 **${count}回** でロール **${role.name}** が付くように設定しました！`
        );
    }
};
