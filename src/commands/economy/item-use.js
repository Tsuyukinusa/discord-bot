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

        // 所持チェック
        if (!db[guildId].users || !db[guildId].users[userId] ||
            !db[guildId].users[userId].items ||
            (item.type !== "role" && (!db[guildId].users[userId].items[itemId] || db[guildId].users[userId].items[itemId] <= 0))
        ) {
            return interaction.reply({
                content: "❌ そのアイテムを持っていません。",
                ephemeral: true
            });
        }

        // 効果の実行
        const userData = db[guildId].users[userId];
        if (!userData.money) userData.money = 0;
        if (!userData.xp) userData.xp = 0;
        if (!userData.vxp) userData.vxp = 0;

        const effectValue = item.effectValue;

        let effectText = "";

        switch (item.type) {
            case "xp":
                userData.xp += effectValue;
                effectText = `🟦 XPが **${effectValue}** 増加！`;
                break;

            case "vxp":
                userData.vxp += effectValue;
                effectText = `🟩 VXPが **${effectValue}** 増加！`;
                break;

            case "gacha":
                if (!userData.gacha) userData.gacha = 0;
                userData.gacha += effectValue;
                effectText = `💎 ガチャダイヤが **${effectValue}** 増加！`;
                break;

            case "pet":
                if (!userData.petXp) userData.petXp = 0;
                userData.petXp += effectValue;
                effectText = `🐾 ペット経験値が **${effectValue}** 増加！`;
                break;

            case "role":
                const role = interaction.guild.roles.cache.get(item.roleId);

                if (!role) {
                    return interaction.reply({ content: "❌ ロールが見つかりません。", ephemeral: true });
                }

                await interaction.member.roles.add(role);

                // 返金
                userData.money += item.sellPrice;

                effectText = `🎖 ロール <@&${role.id}> を付与！\n💰 購入金額 **${item.sellPrice}** を返金しました！`;

                break;
        }

        // 在庫消費（ロールは無限）
        if (item.type !== "role") {
            db[guildId].users[userId].items[itemId]--;
        }

        // 保存
        await writeGuildDB(db);

        // 埋め込み返信
        const embed = new EmbedBuilder()
            .setColor("#00b4ff")
            .setTitle(`✨ ${item.name} を使用した！`)
            .addFields(
                { name: "📄 説明", value: item.description },
                { name: "⚡ 効果", value: effectText },
                { name: "🗨 効果メッセージ", value: item.effectMessage || "（設定なし）" }
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
