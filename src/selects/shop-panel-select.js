import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
    customId: "shop-panel-select",

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const channel = interaction.channel;
        const selected = interaction.values; // ← 選択された itemId 一覧

        const db = await readGuildDB();
        const items = db[guildId].items;

        // --- 埋め込み生成 ---
        const embed = new EmbedBuilder()
            .setColor("#00b7ff")
            .setTitle("🛒 アイテムショップ")
            .setDescription("好きなアイテムを購入できます！");

        for (const id of selected) {
            const item = items[id];
            embed.addFields({
                name: `🎁 ${item.name}`,
                value: `💰 **${item.sellPrice} コイン**\n📦 在庫: ${item.stock ?? "∞"}\n📝 ${item.description}`,
                inline: false
            });
        }

        // 購入ボタン（押したら item-buy に飛ぶ）
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("shop-buy")
                .setLabel("購入画面を開く")
                .setStyle(ButtonStyle.Primary)
        );

        // パネルをチャンネルに送信
        const msg = await channel.send({
            embeds: [embed],
            components: [row]
        });

        // DB 保存（あとで在庫更新とかに使う）
        if (!db[guildId].shopPanels) db[guildId].shopPanels = {};
        db[guildId].shopPanels[msg.id] = {
            items: selected,
            channelId: channel.id
        };

        await writeGuildDB(db);

        // ユーザーに返信（ephemeral）
        return interaction.reply({
            content: "✅ ショップパネルを作成しました！",
            ephemeral: true
        });
    }
};
