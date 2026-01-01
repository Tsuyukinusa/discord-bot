// src/commands/economy/item-stock-add.js
import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} from "discord.js";

import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";
import {
  canAfford,
  subtractBalance
} from "../../Services/economyServices.js";

export default {
  data: new SlashCommandBuilder()
    .setName("item-stock-add")
    .setDescription("アイテムの在庫を追加します")
    .addStringOption(opt =>
      opt.setName("id")
        .setDescription("アイテムID")
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName("amount")
        .setDescription("追加する数量")
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    const itemId = interaction.options.getString("id");
    const amount = interaction.options.getInteger("amount");

    const db = await readGuildDB();

    // --- ギルド & アイテム存在チェック ---
    if (!db[guildId]?.items?.[itemId]) {
      return interaction.reply({
        content: "❌ そのアイテムは存在しません。",
        ephemeral: true
      });
    }

    const item = db[guildId].items[itemId];

    // --- ロールアイテムは在庫不可 ---
    if (item.type === "role") {
      return interaction.reply({
        content: "❌ ロールアイテムには在庫の概念がありません。",
        ephemeral: true
      });
    }

    // --- 権限チェック ---
    if (
      !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild) &&
      item.creator !== userId
    ) {
      return interaction.reply({
        content: "❌ 作成者または管理者のみ在庫を追加できます。",
        ephemeral: true
      });
    }

    // --- 原価計算 ---
    const costTotal = item.cost * amount;

    // --- 残高チェック（economyServices） ---
    const affordable = await canAfford(guildId, userId, costTotal);
    if (!affordable) {
      return interaction.reply({
        content: `❌ 残高が足りません。\n必要金額：**${costTotal.toLocaleString()}**`,
        ephemeral: true
      });
    }

    // --- 支払い（economyServices） ---
    await subtractBalance(guildId, userId, costTotal);

    // --- 在庫初期化 & 追加 ---
    if (typeof item.stock !== "number") item.stock = 0;
    item.stock += amount;

    await writeGuildDB(db);

    // --- Embed ---
    const embed = new EmbedBuilder()
      .setColor("#4b9aff")
      .setTitle("📦 在庫追加完了")
      .addFields(
        { name: "🆔 アイテムID", value: itemId, inline: true },
        { name: "📄 アイテム名", value: item.name, inline: true },
        { name: "➕ 追加数", value: `${amount}`, inline: true },
        { name: "💵 消費金額", value: `${costTotal.toLocaleString()}`, inline: true },
        { name: "📦 現在の在庫", value: `${item.stock}`, inline: true }
      )
      .setTimestamp();

    return interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
};
