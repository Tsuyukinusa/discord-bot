import {
    SlashCommandBuilder,
    EmbedBuilder
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("item-use")
        .setDescription("アイテムを使用します")
        .addStringOption(opt =>
            opt.setName("id")
                .setDescription("使用するアイテムID")
                .setRequired(true)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;
        const itemId = interaction.options.getString("id");

        const db = await readGuildDB();

        if (!db[guildId] || !db[guildId].items || !db[guildId].items[itemId]) {
            return interaction.reply({
                content: "❌ そのアイテムは存在しません。",
                ephemeral: true
            });
        }

        const item = db[guildId].items[itemId];

        // -----------------------
        //  在庫チェック（ロール以外）
        // -----------------------
        if (item.type !== "role") {
            if (!item.stock || item.stock <= 0) {
                return interaction.reply({
                    content: "❌ このアイテムは在庫がありません。",
                    ephemeral: true
                });
            }
        }

        // -----------------------
        //  使用処理
        // -----------------------
        let effectMsg = "";

        switch (item.type) {

            // XP増加
            case "xp":
                if (!db[guildId].users) db[guildId].users = {};
                if (!db[guildId].users[userId]) db[guildId].users[userId] = { xp: 0, vxp: 0, money: 0 };

                db[guildId].users[userId].xp += item.effectValue;
                effectMsg = `✨ **XPが +${item.effectValue} 増加しました！**`;
                break;

            // VXP増加
            case "vxp":
                if (!db[guildId].users) db[guildId].users = {};
                if (!db[guildId].users[userId]) db[guildId].users[userId] = { xp: 0, vxp: 0, money: 0 };

                db[guildId].users[userId].vxp += item.effectValue;
                effectMsg = `🔊 **VXPが +${item.effectValue} 増加しました！**`;
                break;

            // ガチャダイヤ
            case "gacha":
                if (!db[guildId].users) db[guildId].users = {};
                if (!db[guildId].users[userId]) db[guildId].users[userId] = { diamonds: 0 };

                db[guildId].users[userId].diamonds =
                    (db[guildId].users[userId].diamonds || 0) + item.effectValue;

                effectMsg = `💎 **ガチャダイヤを ${item.effectValue} 個入手！**`;
                break;

            // ペット用アイテム
            case "pet":
                effectMsg = `🐾 ペットが **${item.effectValue} XP** 成長しました！`;
                break;

            // ロール付与
            case "role":
                const role = interaction.guild.roles.cache.get(item.roleId);

                if (!role) {
                    return interaction.reply({
                        content: "❌ このロールはもう存在しません。",
                        ephemeral: true
                    });
                }

                await interaction.member.roles.add(role);

                // 返金処理
                if (item.sellPrice) {
                    if (!db[guildId].users) db[guildId].users = {};
                    if (!db[guildId].users[userId]) db[guildId].users[userId] = { money: 0 };
                    db[guildId].users[userId].money += item.sellPrice;
                }

                effectMsg = `🎖 **ロール <@&${item.roleId}> を付与しました！**\n💸 購入金額 **${item.sellPrice}** が返金されました。`;
                break;

            default:
                effectMsg = "（効果不明のアイテムです）";
        }

        // 在庫減少（ロールは無限）
        if (item.type !== "role") {
            item.stock -= 1;
        }

        await writeGuildDB(db);

        // -----------------------
        //  効果メッセージ（埋め込み）
        // -----------------------
        const embed = new EmbedBuilder()
            .setColor("#00c8ff")
            .setTitle(`🎉 アイテム使用: ${item.name}`)
            .setDescription(item.description)   // ← createで設定した説明文
            .addFields({
                name: "✨ 効果",
                value: effectMsg
            });

        return interaction.reply({ embeds: [embed] });
    }
};
