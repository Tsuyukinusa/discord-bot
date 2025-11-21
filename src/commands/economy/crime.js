import { SlashCommandBuilder } from "discord.js";
import { getGuild } from "../../utils/guildDB.js";
import { getUser, updateUser } from "../../utils/userDB.js";

export default {
    data: new SlashCommandBuilder()
        .setName("crime")
        .setDescription("犯罪をして大金とダイヤを稼ぎます。"),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        const guild = getGuild(guildId);
        const user = getUser(guildId, userId);

        const now = Date.now();
        const cd = guild.settings.cooldown.crime * 1000;

        if (user.cooldowns.crime && now - user.cooldowns.crime < cd) {
            const remaining = Math.ceil((cd - (now - user.cooldowns.crime)) / 1000);
            return interaction.reply(`⏳ まだクールダウン中です: **${remaining}秒**`);
        }

        // --- 失敗判定 ---
        const fail = Math.random() < guild.settings.crime.failRate;

        if (fail) {
            const lost =
                Math.floor(
                    Math.random() *
                        (guild.settings.crime.failMoneyMax - guild.settings.crime.failMoneyMin + 1)
                ) + guild.settings.crime.failMoneyMin;

            user.money = Math.max(0, user.money - lost);
            user.cooldowns.crime = now;

            updateUser(guildId, userId, user);

            return interaction.reply(
                `🚨 **大失敗！**\n` +
                    `💸 罰金: -**${lost}**\n` +
                    `💎 ダイヤは失われません。`
            );
        }

        // --- 成功 ---
        const money =
            Math.floor(
                Math.random() *
                    (guild.settings.crime.moneyMax - guild.settings.crime.moneyMin + 1)
            ) + guild.settings.crime.moneyMin;

        const diamond =
            Math.floor(
                Math.random() *
                    (guild.settings.crime.diamondMax - guild.settings.crime.diamondMin + 1)
            ) + guild.settings.crime.diamondMin;

        user.money += money;
        user.diamond += diamond;
        user.cooldowns.crime = now;

        updateUser(guildId, userId, user);

        return interaction.reply(
            `🤑 **犯罪成功！**\n` +
                `💰 お金: +**${money}**\n` +
                `💎 ダイヤ: +**${diamond}**`
        );
    },
};
