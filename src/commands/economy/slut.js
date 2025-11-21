import { SlashCommandBuilder } from "discord.js";
import { getGuild } from "../../utils/guildDB.js";
import { getUser, updateUser } from "../../utils/userDB.js";

export default {
    data: new SlashCommandBuilder()
        .setName("slut")
        .setDescription("危険な仕事をしてお金とダイヤを稼ぎます。"),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        const guild = getGuild(guildId);
        const user = getUser(guildId, userId);

        const now = Date.now();
        const cd = guild.settings.cooldown.slut * 1000;

        // クールダウン
        if (user.cooldowns.slut && now - user.cooldowns.slut < cd) {
            const remaining = Math.ceil((cd - (now - user.cooldowns.slut)) / 1000);
            return interaction.reply(`⏳ まだクールダウン中です: **${remaining}秒**`);
        }

        // --- 失敗判定 ---
        const fail = Math.random() < guild.settings.slut.failRate; // 0〜1

        if (fail) {
            // 失敗金額
            const lost =
                Math.floor(
                    Math.random() *
                        (guild.settings.slut.failMoneyMax - guild.settings.slut.failMoneyMin + 1)
                ) + guild.settings.slut.failMoneyMin;

            user.money = Math.max(0, user.money - lost);
            user.cooldowns.slut = now;
            updateUser(guildId, userId, user);

            return interaction.reply(
                `💥 **失敗しました…**\n` +
                    `💸 罰金: -**${lost}**\n` +
                    `💎 ダイヤは失われません。`
            );
        }

        // --- 成功の場合 ---
        const money =
            Math.floor(
                Math.random() *
                    (guild.settings.slut.moneyMax - guild.settings.slut.moneyMin + 1)
            ) + guild.settings.slut.moneyMin;

        const diamond =
            Math.floor(
                Math.random() *
                    (guild.settings.slut.diamondMax - guild.settings.slut.diamondMin + 1)
            ) + guild.settings.slut.diamondMin;

        user.money += money;
        user.diamond += diamond;
        user.cooldowns.slut = now;

        updateUser(guildId, userId, user);

        return interaction.reply(
            `🔥 **成功！**\n` +
                `💰 お金: +**${money}**\n` +
                `💎 ダイヤ: +**${diamond}**`
        );
    },
};
