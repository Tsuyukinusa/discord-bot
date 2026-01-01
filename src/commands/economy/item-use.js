import {
  SlashCommandBuilder,
  EmbedBuilder
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";

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

    // --- アイテム存在チェック ---
    if (!db[guildId]?.items?.[itemId]) {
      return interaction.reply({
        content: "❌ そのアイテムは存在しません。",
        ephemeral: true
      });
    }

    const item = db[guildId].items[itemId];

    // --- ロール系は use 不可 ---
    if (item.type === "role") {
      return interaction.reply({
        content: "❌ ロールアイテムは使用できません。（購入時に自動付与されます）",
        ephemeral: true
      });
    }

    // --- ユーザーデータ初期化（economyServices互換） ---
    if (!db[guildId].users) db[guildId].users = {};
    if (!db[guildId].users[userId]) {
      db[guildId].users[userId] = {
        balance: 0,
        xp: 0,
        vxp: 0,
        diamonds: 0,
        inventory: {}
      };
    }

    const user = db[guildId].users[userId];

    // --- 所持チェック ---
    if (!user.inventory[itemId] || user.inventory[itemId] <= 0) {
      return interaction.reply({
        content: "❌ そのアイテムを所持していません。",
        ephemeral: true
      });
    }

    // ========================
    // 効果処理
    // ========================
    let effectResult = "";

    switch (item.type) {
      case "xp":
        user.xp += item.effectValue;
        effectResult = `✨ XPが **+${item.effectValue}** 増加しました`;
        break;

      case "vxp":
        user.vxp += item.effectValue;
        effectResult = `🔊 VXPが **+${item.effectValue}** 増加しました`;
        break;

      case "gacha":
        user.diamonds += item.effectValue;
        effectResult = `💎 ダイヤを **${item.effectValue} 個** 獲得しました`;
        break;

      default:
        effectResult = "⚠️ このアイテムの効果は未定義です";
    }

    // --- 消費処理 ---
    user.inventory[itemId] -= 1;
    if (user.inventory[itemId] <= 0) {
      delete user.inventory[itemId];
    }

    await writeGuildDB(db);

    // ========================
    // Embed
    // ========================
    const embed = new EmbedBuilder()
      .setColor("#00c8ff")
      .setTitle(`🎉 アイテム使用：${item.name}`)
      .setDescription(item.description || " ")
      .addFields({
        name: "✨ 効果",
        value: effectResult
      })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
