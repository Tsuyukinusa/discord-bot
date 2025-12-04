import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
    data: {
        name: "shop-panel-select"
    },

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const channel = interaction.channel;

        const selectedIds = interaction.values; // 選ばれたアイテムID配列

        const db = await readGuildDB();
        const items = db[guildId].items;

        // --- 埋め込み作成 ---
        const embed = new EmbedBuilder()
            .setTitle("🛒 アイテムショップ")
            .setDescription("購入したいアイテムを選んでください！")
            .setColor(0x00b0f4)
            .addFields(
                selectedIds.map(id => ({
                    name: items[id].name,
                    value: `💰 **価格:** ${items[id].price}\n📦 **在庫:** ${items[id].stock}`,
                }))
            );

        // --- 購入ボタン（1メッセージ共通） ---
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("shop-buy")
                .setLabel("購入する")
                .setStyle(ButtonStyle.Primary)
        );

        // チャンネルにショップを送信
        const message = await channel.send({
            embeds: [embed],
            components: [row]
        });

        // DB に保存（後で在庫更新などに使う）
        db[guildId].shopPanels[message.id] = {
            items: selectedIds
        };
        await writeGuildDB(db);

        await interaction.reply({
            content: "✅ ショップパネルを作成しました！",
            ephemeral: true
        });
    }
};
