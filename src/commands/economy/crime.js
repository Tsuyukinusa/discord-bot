import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { readGuildDB } from "../../utils/core/file.js";
import { getUser, updateUser } from "../../utils/core/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("crime")
        .setDescription("犯罪に手を染めて大金とダイヤを稼ぎます。失敗すると罰金。"),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        const guild = readGuildDB(guildId);
        const user = getUser(guildId, userId);

        const now = Date.now();

        // --- クールダウン ---
        const cd = guild.settings.cooldown.crime * 1000;
        if (user.cooldowns.crime && now - user.cooldowns.crime < cd) {
            const remaining = Math.ceil((cd - (now - user.cooldowns.crime)) / 1000);

            const embed = new EmbedBuilder()
                .setColor(0xffcc00)
                .setTitle("⏳ クールダウン中")
                .setDescription(`あと **${remaining}秒** 待ってください。`);

            return interaction.reply({ embeds: [embed] });
        }

        // === 成功 or 失敗判定 ===
        const failRate = guild.settings.crime.failRate; // 0〜100 (%)
        const isFail = Math.random() * 100 < failRate;

        let replyText = "";
        let embedColor = 0x00c3ff;

        // ===========================
        //           成功
        // ===========================
        if (!isFail) {
            const money =
                Math.floor(
                    Math.random() *
                        (guild.settings.crime.moneyMax - guild.settings.crime.moneyMin + 1)
                ) + guild.settings.crime.moneyMin;

            const diamond =
                Math.floor(
                    Math.random() *
                        (guild.settings.crime.diamondMax -
                            guild.settings.crime.diamondMin +
                            1)
                ) + guild.settings.crime.diamondMin;

            user.balance += money;
            user.diamond += diamond;

            // カスタムリプライ
            const list = guild.settings.replies.success.crime;
            if (list.length > 0) {
                const template = list[Math.floor(Math.random() * list.length)];

                replyText = template
                    .replaceAll("{user}", `<@${userId}>`)
                    .replaceAll("{money}", `${money}`)
                    .replaceAll("{diamond}", `${diamond}`);
            } else {
                replyText =
                    `🕶️ **犯罪成功！**\n` +
                    `💰 お金: +**${money}**\n` +
                    `💎 ダイヤ: +**${diamond}**`;
            }
        }

        // ===========================
        //           失敗
        // ===========================
        else {
            const failMoney =
                Math.floor(
                    Math.random() *
                        (guild.settings.crime.failMoneyMax -
                            guild.settings.crime.failMoneyMin +
                            1)
                ) + guild.settings.crime.failMoneyMin;

            user.balance -= failMoney;
            embedColor = 0xff0000;

            const list = guild.settings.replies.fail.crime;
            if (list.length > 0) {
                const template = list[Math.floor(Math.random() * list.length)];

                replyText = template
                    .replaceAll("{user}", `<@${userId}>`)
                    .replaceAll("{failMoney}", `${failMoney}`);
            } else {
                replyText =
                    `🚨 **犯罪失敗！**\n` +
                    `罰金: -**${failMoney}**`;
            }
        }

        // --- セーブ ---
        user.cooldowns.crime = now;
        updateUser(guildId, userId, user);

        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle("🕶️ Crime 結果")
            .setDescription(replyText);

        return interaction.reply({ embeds: [embed] });
    }
};
