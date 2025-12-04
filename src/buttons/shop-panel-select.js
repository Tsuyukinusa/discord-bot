import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../../utils/file.js";

export default {
    customId: "shop-panel-select",

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const channelId = interaction.channel.id;

        const db = await readGuildDB();
        const items = db[guildId].items;

        const selected = interaction.values; // 選択された itemID の配列

        // --- 埋め込み生成 ---
        const embed = new EmbedBuilder()
            .setTitle("🛒 アイテムショップ")
            .setDescription("以下のアイテムを購入できます！")
            .setColor(0x00BFFF);

        selected.forEach((id) => {
            const item = items[id];
            embed.addFields({
                name: item.name,
                value: `💴価格: **${item.price}**\n📦在庫: **${item.stock ?? 0}**`,
                inline: false,
            });
        });

        // --- 購入ボタン（後で実装） ---
        const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("shop-buy")
                .setLabel("購入する")
                .setStyle(ButtonStyle.Primary)
        );

        // --- 公開チャンネルに送信 ---
        const msg = await interaction.channel.send({
            embeds: [embed],
            components: [buttonRow]
        });

        // --- DBに保存（どのパネルが何を扱うか） ---
        if (!db[guildId].shopPanels) db[guildId].shopPanels = {};

        db[guildId].shopPanels[msg.id] = {
            items: selected,
            channelId,
        };

        await writeGuildDB(db);

        await interaction.update({
            content: "✅ ショップパネルを作成しました！",
            components: []
        });
    }
};
