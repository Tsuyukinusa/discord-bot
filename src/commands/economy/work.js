import { SlashCommandBuilder } from "discord.js";
import { getGuild } from "../../utils/guildDB.js";
import { getUser, updateUser } from "../../utils/userDB.js";

export default {
    data: new SlashCommandBuilder()
        .setName("work")
        .setDescription("仕事してお金とダイヤを稼ぎます。"),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        const guild = getGuild(guildId);
        const user = getUser(guildId, userId);

        const now = Date.now();

        // --- クールダウンチェック ---
        const cd = guild.settings.cooldown.work * 1000;
        if (user.cooldowns.work && now - user.cooldowns.work < cd) {
            const remaining = Math.ceil((cd - (now - user.cooldowns.work)) / 1000);
            return interaction.reply(`⏳ まだクールダウン中です: **${remaining}秒**`);
        }

        // --- ランダム金額とダイヤ ---
        const money =
            Math.floor(
                Math.random() *
                    (guild.settings.work.moneyMax - guild.settings.work.moneyMin + 1)
            ) + guild.settings.work.moneyMin;

        const diamond =
            Math.floor(
                Math.random() *
                    (guild.settings.work.diamondMax - guild.settings.work.diamondMin + 1)
            ) + guild.settings.work.diamondMin;

        // --- 更新 ---
        user.money += money;
        user.diamond += diamond;
        user.cooldowns.work = now;

        updateUser(guildId, userId, user);

        return interaction.reply(
            `💼 **仕事完了！**\n` +
                `💰 お金: +**${money}**\n` +
                `💎 ダイヤ: +**${diamond}**`
        );
    },
};
