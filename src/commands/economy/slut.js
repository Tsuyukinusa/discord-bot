import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
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

        // --- クールダウン ---
        const cd = guild.settings.cooldown.slut * 1000;
        if (user.cooldowns.slut && now - user.cooldowns.slut < cd) {
            const remaining = Math.ceil((cd - (now - user.cooldowns.slut)) / 1000);

            const embed = new EmbedBuilder()
                .setColor(0xffcc00)
                .setTitle("⏳ クールダウン中")
                .setDescription(`あと **${remaining}秒** 待ってね。`);

            return interaction.reply({ embeds: [embed] });
        }

        // --- 成功 or 失敗判定 ---
        const failRate = guild.settings.slut.failRate; // 0〜100 (%)
        const isFail = Math.random() * 100 < failRate;

        let replyText = "";
        let embedColor = 0x00c3ff;

        // ===========================
        //         成功
        // ===========================
        if (!isFail) {
            const money =
                Math.floor(
                    Math.random() *
                        (guild.settings.slut.moneyMax -
                            guild.settings.slut.moneyMin +
                            1)
                ) + guild.settings.slut.moneyMin;

            const diamond =
                Math.floor(
                    Math.random() *
                        (guild.settings.slut.diamondMax -
                            guild.settings.slut.diamondMin +
                            1)
                ) + guild.settings.slut.diamondMin;

            user.money += money;
            user.diamond += diamond;

            // カスタムリプライ
            const list = guild.settings.replies.success.slut;
            if (list.length > 0) {
                const template = list[Math.floor(Math.random() * list.length)];

                replyText = template
                    .replaceAll("{user}", `<@${userId}>`)
                    .replaceAll("{money}", `${money}`)
                    .replaceAll("{diamond}", `${diamond}`);
            } else {
                replyText =
                    `💋 **成功！**\n` +
                    `💰 お金: +**${money}**\n` +
                    `💎 ダイヤ: +**${diamond}**`;
            }
        }

        // ===========================
        //         失敗
        // ===========================
        else {
            const failMoney =
                Math.floor(
                    Math.random() *
                        (guild.settings.slut.failMoneyMax -
                            guild.settings.slut.failMoneyMin +
                            1)
                ) + guild.settings.slut.failMoneyMin;

            user.money -= failMoney;
            embedColor = 0xff0000;

            // カスタムリプライ
            const list = guild.settings.replies.fail.slut;
            if (list.length > 0) {
                const template = list[Math.floor(Math.random() * list.length)];

                replyText = template
                    .replaceAll("{user}", `<@${userId}>`)
                    .replaceAll("{failMoney}", `${failMoney}`);
            } else {
                replyText =
                    `💔 **失敗…**\n` +
                    `罰金: -**${failMoney}**`;
            }
        }

        // --- セーブ ---
        user.cooldowns.slut = now;
        updateUser(guildId, userId, user);

        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle("💋 Slut 結果")
            .setDescription(replyText);

        return interaction.reply({ embeds: [embed] });
    }
};
