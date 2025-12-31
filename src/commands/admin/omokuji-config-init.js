// commands/fun/omikuji-config-init.js
import { SlashCommandBuilder } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("omikuji-config-init")
        .setDescription("おみくじの初期設定を作成します（管理者専用）"),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const db = await readGuildDB();

        if (!db[guildId]) db[guildId] = {};

        // すでに設定がある場合
        if (db[guildId].omikujiConfig) {
            return interaction.reply({
                content: "⚠️ すでにおみくじ設定が存在します。",
                ephemeral: true
            });
        }

        // 🟦 あなたが作った初期設定をそのまま入れる
        db[guildId].omikujiConfig = {
            results: {
                daikichi: {
                    name: "大吉",
                    weight: 3,
                    rewards: { money: 1000, xp: 200, diamond: 3, items: [] }
                },
                tyuukichi: {
                    name: "中吉",
                    weight: 10,
                    rewards: { money: 500, xp: 100, diamond: 1, items: [] }
                },
                syoukichi: {
                    name: "小吉",
                    weight: 20,
                    rewards: { money: 300, xp: 60, diamond: 0, items: [] }
                },
                kichi: {
                    name: "吉",
                    weight: 25,
                    rewards: { money: 200, xp: 30, diamond: 0, items: [] }
                },
                suekichi: {
                    name: "末吉",
                    weight: 15,
                    rewards: { money: 150, xp: 20, diamond: 0, items: [] }
                },
                kyou: {
                    name: "凶",
                    weight: 10,
                    rewards: { money: 50, xp: 10, diamond: 0, items: [] }
                },
                daikyou: {
                    name: "大凶",
                    weight: 5,
                    rewards: { money: 20, xp: 5, diamond: 0, items: [] }
                },
                gokukyou: {
                    name: "極凶",
                    weight: 1,
                    rewards: { money: 10, xp: 2, diamond: 0, items: [] },
                    giveRole: true
                }
            },

            gokukyouRoleRewards: {
                1: "ROLE_ID_1",
                5: "ROLE_ID_2",
                10: "ROLE_ID_3"
            }
        };

        await writeGuildDB(db);

        return interaction.reply({
            content: "✅ **おみくじ初期設定を作成しました！**\nあとで編集コマンドも作れます。",
            ephemeral: false
        });
    }
};
