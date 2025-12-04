import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
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
        if (!db[guildId] || !db[guildId].omikujiConfig) {

            const errorEmbed = new EmbedBuilder()
                .setTitle("❌ 設定エラー")
                .setDescription("おみくじ設定が見つかりません。まず `/omikuji-config-init` を実行してください。")
                .setColor("Red");

            return interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true
            });
        }

        // 設定保存
        db[guildId].omikujiConfig.gokukyouRoleRewards[count] = role.id;
        await writeGuildDB(db);

        // 成功メッセージ
        const embed = new EmbedBuilder()
            .setTitle("✨ 極凶ロール設定を更新しました")
            .setColor("Purple")
            .addFields(
                { name: "極凶を引いた回数", value: `${count} 回`, inline: true },
                { name: "付与されるロール", value: `${role}`, inline: true }
            )
            .setTimestamp();

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};
