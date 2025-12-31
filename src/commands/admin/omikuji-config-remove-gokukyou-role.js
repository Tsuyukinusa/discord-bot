import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("omikuji-config-remove-gokukyou-role")
        .setDescription("極凶ロール設定を削除します（管理者専用）")
        .addIntegerOption(opt =>
            opt.setName("count")
                .setDescription("極凶を引いた回数")
                .setRequired(true)
                .setMinValue(1)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const count = interaction.options.getInteger("count");

        const db = await readGuildDB();

        if (!db[guildId] || !db[guildId].omikujiConfig) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("❌ 設定がありません")
                        .setDescription("おみくじ設定がまだ作成されていません。")
                ],
                ephemeral: true
            });
        }

        if (!db[guildId].omikujiConfig.gokukyouRoleRewards[count]) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setTitle("❌ ロール設定なし")
                        .setDescription(`極凶 **${count}回** のロール設定は存在しません。`)
                ],
                ephemeral: true
            });
        }

        delete db[guildId].omikujiConfig.gokukyouRoleRewards[count];
        await writeGuildDB(db);

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Green")
                    .setTitle("🗑️ ロール設定を削除しました")
                    .setDescription(`極凶 **${count}回** のロール報酬を削除しました。`)
            ],
            ephemeral: true
        });
    }
};
