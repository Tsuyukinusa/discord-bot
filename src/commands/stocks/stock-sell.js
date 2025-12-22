// commands/stocks/stock-sell.js
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("stock-sell")
        .setDescription("株を売却します")
        .addStringOption(o =>
            o.setName("id")
                .setDescription("会社ID")
                .setRequired(true)
        )
        .addIntegerOption(o =>
            o.setName("amount")
                .setDescription("売却する株数")
                .setRequired(true)
                .setMinValue(1)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        const stockId = interaction.options.getString("id");
        const amount = interaction.options.getInteger("amount");

        const db = await readGuildDB();

        // --- 株存在チェック ---
        const stock = db[guildId]?.stocks?.[stockId];
        if (!stock) {
            return interaction.reply({
                content: "❌ その会社は存在しません。",
                ephemeral: true
            });
        }

        // --- ユーザーデータ初期化 ---
        if (!db[guildId].users) db[guildId].users = {};
        if (!db[guildId].users[userId]) {
            db[guildId].users[userId] = { money: 0, stocks: {} };
        }
        if (!db[guildId].users[userId].stocks) {
            db[guildId].users[userId].stocks = {};
        }

        const userStocks = db[guildId].users[userId].stocks[stockId] || 0;

        // --- 所有数チェック ---
        if (userStocks < amount) {
            return interaction.reply({
                content: `❌ 所有株数が足りません。（所持: ${userStocks}株）`,
                ephemeral: true
            });
        }

        // --- 売却処理 ---
        const sellPrice = stock.price * amount;

        db[guildId].users[userId].stocks[stockId] -= amount;
        db[guildId].users[userId].money += sellPrice;

        // 0株になったらキー削除（きれいに）
        if (db[guildId].users[userId].stocks[stockId] <= 0) {
            delete db[guildId].users[userId].stocks[stockId];
        }

        await writeGuildDB(db);

        // --- 埋め込み ---
        const embed = new EmbedBuilder()
            .setColor("#ff5252")
            .setTitle("📉 株式売却完了")
            .addFields(
                { name: "🏢 会社", value: stock.name, inline: true },
                { name: "📦 売却株数", value: `${amount} 株`, inline: true },
                { name: "💰 売却額", value: `${sellPrice.toLocaleString()}`, inline: false },
                { name: "📊 現在の株価", value: `${stock.price}`, inline: true },
                {
                    name: "📁 残り保有数",
                    value: `${db[guildId].users[userId].stocks[stockId] || 0} 株`,
                    inline: true
                }
            )
            .setTimestamp();

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};
