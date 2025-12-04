// commands/omikuji/omikuji.js
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("omikuji")
        .setDescription("今日の運勢を占います（1日1回）"),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        const db = await readGuildDB();
        if (!db[guildId]) db[guildId] = {};

        // -------------------------------
        // 初期 omikujiConfig が無ければ作る
        // -------------------------------
        if (!db[guildId].omikujiConfig) {
            db[guildId].omikujiConfig = {
                results: {
                    daikichi: { name: "大吉", weight: 3, rewards: { money: 1000, xp: 200, diamond: 3, items: [] } },
                    tyuukichi: { name: "中吉", weight: 10, rewards: { money: 500, xp: 100, diamond: 1, items: [] } },
                    syoukichi: { name: "小吉", weight: 20, rewards: { money: 300, xp: 60, diamond: 0, items: [] } },
                    kichi: { name: "吉", weight: 25, rewards: { money: 200, xp: 30, diamond: 0, items: [] } },
                    suekichi: { name: "末吉", weight: 15, rewards: { money: 150, xp: 20, diamond: 0, items: [] } },
                    kyou: { name: "凶", weight: 10, rewards: { money: 50, xp: 10, diamond: 0, items: [] } },
                    daikyou: { name: "大凶", weight: 5, rewards: { money: 20, xp: 5, diamond: 0, items: [] } },
                    gokukyou: { name: "極凶", weight: 1, rewards: { money: 10, xp: 2, diamond: 0, items: [] }, giveRole: true }
                },
                gokukyouRoleRewards: {
                    1: "ROLE_ID_1",
                    5: "ROLE_ID_2",
                    10: "ROLE_ID_3"
                }
            };
        }

        const config = db[guildId].omikujiConfig;

        // -------------------------------
        // 1日1回の制限
        // -------------------------------
        if (!db[guildId].users) db[guildId].users = {};
        if (!db[guildId].users[userId]) db[guildId].users[userId] = {};

        const user = db[guildId].users[userId];
        const today = new Date().toDateString();

        if (user.lastOmikuji === today) {
            return interaction.reply({
                content: "❌ 今日のおみくじはもう引きました！",
            });
        }

        user.lastOmikuji = today;

        // -------------------------------
        // 抽選処理（weight）
        // -------------------------------
        const entries = Object.entries(config.results);
        const totalWeight = entries.reduce((s, [, r]) => s + r.weight, 0);
        let rng = Math.random() * totalWeight;

        let selectedKey = entries[0][0];
        for (const [key, result] of entries) {
            if (rng < result.weight) {
                selectedKey = key;
                break;
            }
            rng -= result.weight;
        }

        const result = config.results[selectedKey];

        // -------------------------------
        // 報酬付与
        // -------------------------------
        if (!user.money) user.money = 0;
        if (!user.xp) user.xp = 0;
        if (!user.diamond) user.diamond = 0;
        if (!user.items) user.items = {};

        user.money += result.rewards.money;
        user.xp += result.rewards.xp;
        user.diamond += result.rewards.diamond;

        for (const itemObj of result.rewards.items) {
            if (!user.items[itemObj.id]) user.items[itemObj.id] = 0;
            user.items[itemObj.id] += itemObj.amount;
        }

        // -------------------------------
        // 極凶ロール処理
        // -------------------------------
        let roleGiven = null;

        if (selectedKey === "gokukyou") {
            if (!user.gokukyouCount) user.gokukyouCount = 0;
            user.gokukyouCount++;

            const count = user.gokukyouCount;
            const rewardRoles = config.gokukyouRoleRewards;

            if (rewardRoles[count]) {
                const roleId = rewardRoles[count];
                const role = interaction.guild.roles.cache.get(roleId);

                if (role) {
                    await interaction.member.roles.add(role);
                    roleGiven = role;
                }
            }
        }

        await writeGuildDB(db);

        // -------------------------------
        // 完成メッセージ（全体公開）
        // -------------------------------
        const embed = new EmbedBuilder()
            .setColor("#ff4b4b")
            .setTitle(`🎯 今日の運勢：${result.name}`)
            .addFields(
                { name: "💰 お金", value: `${result.rewards.money}`, inline: true },
                { name: "✨ XP", value: `${result.rewards.xp}`, inline: true },
                { name: "💎 ダイヤ", value: `${result.rewards.diamond}`, inline: true }
            );

        if (roleGiven) {
            embed.addFields({
                name: "🎖 ボーナスロール獲得！",
                value: `> ${roleGiven}`

