// commands/fun/omikuji.js
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";
import { readUserDB, writeUserDB } from "../../utils/userfile.js";

export default {
    data: new SlashCommandBuilder()
        .setName("omikuji")
        .setDescription("今日のおみくじを引きます"),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        const guildDB = await readGuildDB();
        const userDB = await readUserDB();

        // --- 設定読み込み ---
        const cfg = guildDB[guildId]?.omikujiConfig;
        if (!cfg) return interaction.reply({ content: "❌ このサーバーではおみくじが設定されていません。", ephemeral: true });

        // --- 1日1回制限 ---
        const today = new Date().toLocaleDateString("ja-JP");
        const last = userDB[userId]?.lastOmikuji || null;

        if (last === today) {
            return interaction.reply({
                content: "❌ 今日のおみくじはもう引きました！",
                ephemeral: true
            });
        }

        // --- ランダム抽選 ---
        const results = Object.values(cfg.results);
        const weights = results.map(r => r.weight);
        const total = weights.reduce((a, b) => a + b, 0);

        let rnd = Math.random() * total;
        let chosen = null;

        for (let i = 0; i < results.length; i++) {
            if (rnd < weights[i]) {
                chosen = results[i];
                break;
            }
            rnd -= weights[i];
        }

        if (!chosen) chosen = results[0];

        // --- ユーザーのデータへの反映 ---
        if (!userDB[userId]) userDB[userId] = {
            money: 0,
            xp: 0,
            diamond: 0,
            items: [],
            gokukyouCount: 0
        };

        let gained = [];
        let lost = [];

        // お金
        if (chosen.rewards.money) {
            const v = chosen.rewards.money;
            userDB[userId].money += v;
            if (v > 0) gained.push(`💰 お金 +${v}`); else lost.push(`💸 お金 ${v}`);
        }
        // XP
        if (chosen.rewards.xp) {
            const v = chosen.rewards.xp;
            userDB[userId].xp += v;
            if (v > 0) gained.push(`✨ XP +${v}`); else lost.push(`⚡ XP ${v}`);
        }
        // ダイヤ
        if (chosen.rewards.diamond) {
            const v = chosen.rewards.diamond;
            userDB[userId].diamond += v;
            if (v > 0) gained.push(`💎 ダイヤ +${v}`); else lost.push(`🪨 ダイヤ ${v}`);
        }

        // アイテム
        if (chosen.rewards.items?.length > 0) {
            for (const it of chosen.rewards.items) {
                userDB[userId].items.push({ id: it.id, amount: it.amount });
                gained.push(`📦 アイテム ${it.id} x${it.amount}`);
            }
        }

        // 極凶ならカウント + ロール付与
        if (chosen.id === "gokukyou") {
            userDB[userId].gokukyouCount++;

            const count = userDB[userId].gokukyouCount;
            const roleId = cfg.gokukyouRoleRewards[count];
            if (roleId) {
                const role = interaction.guild.roles.cache.get(roleId);
                if (role) {
                    await interaction.member.roles.add(role);
                    gained.push(`🎭 ロール付与: **${role.name}**`);
                }
            }
        }

        // 最終記録更新
        userDB[userId].lastOmikuji = today;

        await writeUserDB(userDB);

        // --- 埋め込み作成 ---
        const embed = new EmbedBuilder()
            .setTitle(`🎴 おみくじ結果：${chosen.name}`)
            .setColor(chosen.color || "#ffffff")
            .addFields(
                { name: "結果", value: `**${chosen.name}**`, inline: false },
            );

        if (gained.length > 0)
            embed.addFields({ name: "📈 もらえたもの", value: gained.join("\n"), inline: false });

        if (lost.length > 0)
            embed.addFields({ name: "📉 失ったもの", value: lost.join("\n"), inline: false });

        embed.setFooter({ text: "毎日0時にリセットされます" });

        // 返信は全員に見える（あなたの希望）
        return interaction.reply({ embeds: [embed] });
    }
};
