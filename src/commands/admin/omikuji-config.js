// commands/admin/omikuji-config.js
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { readGuildDB } from "../../utils/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("omikuji-config")
        .setDescription("おみくじ設定の管理（管理者専用）")
        .addSubcommand(sub =>
            sub.setName("show")
               .setDescription("現在のおみくじ設定を表示します")
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const db = await readGuildDB();

        if (!db[guildId] || !db[guildId].omikujiConfig) {
            return interaction.reply({
                content: "❌ おみくじ設定がありません。まず `/omikuji-config-init` を実行してください。",
                ephemeral: true
            });
        }

        const config = db[guildId].omikujiConfig;

        // Embed 作成
        const embed = new EmbedBuilder()
            .setColor("#4b9aff")
            .setTitle("🎯 おみくじ設定一覧");

        for (const key of Object.keys(config.results)) {
            const r = config.results[key];
            embed.addFields({
                name: `${r.name} (${key})`,
                value: `確率(重み): **${r.weight}**\n報酬: 💰${r.rewards.money}, XP:${r.rewards.xp}, 💎${r.rewards.diamond}`,
                inline: false
            });
        }

        // 極凶ロール一覧
        let roleList = Object.entries(config.gokukyouRoleRewards)
            .map(([count, roleId]) => `${count}回 → <@&${roleId}>`)
            .join("\n");

        if (!roleList) roleList = "（設定なし）";

        embed.addFields({
            name: "👹 極凶ロール設定",
            value: roleList
        });

        return interaction.reply({ embeds: [embed] });
    }
};
