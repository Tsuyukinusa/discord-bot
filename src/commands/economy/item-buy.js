// src/commands/economy/item-buy.js
import {
  SlashCommandBuilder,
  EmbedBuilder
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";
import {
  getBalance,
  canAfford,
  subtractBalance
} from "../../Services/economyServices.js";

export default {
  data: new SlashCommandBuilder()
    .setName("item-buy")
    .setDescription("アイテムを購入します")
    .addStringOption(opt =>
      opt.setName("id")
        .setDescription("購入するアイテムID")
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName("amount")
        .setDescription("購入数（ロールは1固定）")
        .setMinValue(1)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    const itemId = interaction.options.getString("id");
    const amountInput = interaction.options.getInteger("amount") ?? 1;

    const db = await readGuildDB();
    const item = db[guildId]?.items?.[itemId];

    if (!item) {
      return interaction.reply({
        content: "❌ 指定したアイテムは存在しません。",
        ephemeral: true
      });
    }

    // ユーザー初期化
    if (!db[guildId].users) db[guildId].users = {};
    if (!db[guildId].users[userId]) {
      db[guildId].users[userId] = { balance: 0, inventory: {} };
    }

    const currency = db[guildId].currency?.symbol ?? "¥";
    const buyAmount = item.type === "role" ? 1 : amountInput;
    const totalCost = item.cost * buyAmount;

    // 💰 残高チェック（services）
    if (!(await canAfford(guildId, userId, totalCost))) {
      return interaction.reply({
        content: `❌ 所持金が足りません。（必要: ${currency}${totalCost}）`,
        ephemeral: true
      });
    }

    // 📦 在庫チェック
    if (typeof item.stock === "number" && item.stock < buyAmount) {
      return interaction.reply({
        content: `❌ 在庫が不足しています。（現在: ${item.stock}）`,
        ephemeral: true
      });
    }

    // 💸 支払い
    await subtractBalance(guildId, userId, totalCost);

    // 在庫・インベントリ処理
    if (typeof item.stock === "number") item.stock -= buyAmount;
    db[guildId].users[userId].inventory[itemId] =
      (db[guildId].users[userId].inventory[itemId] || 0) + buyAmount;

    await writeGuildDB(db);

    const balance = await getBalance(guildId, userId);

    const embed = new EmbedBuilder()
      .setColor("#00aaff")
      .setTitle("🛒 アイテム購入完了")
      .addFields(
        { name: "アイテム", value: `${item.name} × ${buyAmount}` },
        { name: "消費金額", value: `${currency}${totalCost}` },
        { name: "残り所持金", value: `${currency}${balance}` }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
