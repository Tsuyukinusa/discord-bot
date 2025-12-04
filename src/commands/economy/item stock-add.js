import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getGuild, updateGuild } from "../../utils/guildDB.js";
import { getUser, updateUser } from "../../utils/userDB.js"; // あなたの utils に合わせてパス調整してね

export default {
  data: new SlashCommandBuilder()
    .setName("item-stock-add")
    .setDescription("アイテムの在庫を追加します（原価×個数を支払います）")
    .addStringOption(opt =>
      opt
        .setName("itemid")
        .setDescription("在庫を追加したいアイテムの ID")
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt
        .setName("amount")
        .setDescription("追加する個数")
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const itemIdRaw = interaction.options.getString("itemid");
    const amount = interaction.options.getInteger("amount");

    const itemId = itemIdRaw.trim();

    // ギルド読み込み
    const guild = getGuild(guildId);

    // items の場所を柔軟に探す（guild.items または guild.settings.items）
    const itemsContainer = guild.items || (guild.settings && guild.settings.items) || {};

    const item = itemsContainer[itemId];

    if (!item) {
      const notFound = new EmbedBuilder()
        .setTitle("❌ アイテムが見つかりません")
        .setDescription(`指定されたアイテム ID \`${itemId}\` は存在しません。`)
        .setColor(0xff4444)
        .setTimestamp();
      return interaction.reply({ embeds: [notFound], ephemeral: true });
    }

    // Roleタイプは在庫無限のため追加できない
    if (item.type === "role") {
      const roleErr = new EmbedBuilder()
        .setTitle("❌ 在庫追加不可")
        .setDescription("このアイテムは **ロール付与アイテム** のため、在庫を追加する概念がありません。")
        .setColor(0xffaa00)
        .setTimestamp();
      return interaction.reply({ embeds: [roleErr], ephemeral: true });
    }

    // item.cost（原価）が必須
    const costPerUnit = Number(item.cost ?? item.priceCost ?? item.origCost ?? 0);
    if (!costPerUnit || costPerUnit <= 0) {
      const noCost = new EmbedBuilder()
        .setTitle("❌ 原価が設定されていません")
        .setDescription("このアイテムは原価が設定されていないため、在庫追加できません。")
        .setColor(0xff4444)
        .setTimestamp();
      return interaction.reply({ embeds: [noCost], ephemeral: true });
    }

    const totalCost = costPerUnit * amount;

    // ユーザー取得（お財布チェック）
    const user = getUser(guildId, userId); // getUser(guildId,userId) の形式を使っている前提
    // ensure numeric fields
    if (typeof user.balance === "undefined") user.balance = typeof user.money !== "undefined" ? user.money : 0;
    if (typeof user.balance === "undefined") user.balance = 0;

    if (user.balance < totalCost) {
      const notEnough = new EmbedBuilder()
        .setTitle("❌ 所持金不足")
        .setDescription(`追加に必要な金額 **${totalCost.toLocaleString()}** が足りません。所持金: **${(user.balance || 0).toLocaleString()}**`)
        .setColor(0xff4444)
        .setTimestamp();
      return interaction.reply({ embeds: [notEnough], ephemeral: true });
    }

    // 在庫追加処理（itemsContainer が guild 内の参照であることを想定）
    // itemsContainer は guild の参照ではない可能性があるので、安全に更新してから save
    // まず guild の正しい場所を決定して更新する
    if (guild.items) {
      guild.items[itemId].stock = (guild.items[itemId].stock || 0) + amount;
    } else if (guild.settings && guild.settings.items) {
      guild.settings.items[itemId].stock = (guild.settings.items[itemId].stock || 0) + amount;
    } else {
      // 両方ないなら作る（普段は起きないはず）
      guild.items = guild.items || {};
      guild.items[itemId] = { ...item, stock: amount };
    }

    // ユーザーから原価×個数を引く（balance フィールドを想定）
    user.balance -= totalCost;
    // 互換性のため money フィールドも更新しておく（プロジェクトで money を使っている場合）
    user.money = user.balance;

    // 保存
    updateGuild(guildId, guild);
    updateUser(guildId, userId, user);

    const okEmbed = new EmbedBuilder()
      .setTitle("✅ 在庫を追加しました")
      .setColor(0x55cc99)
      .setDescription(`**${item.name}** (ID: \`${itemId}\`) の在庫を **${amount}** 個追加しました。`)
      .addFields(
        { name: "支払った合計", value: `${totalCost.toLocaleString()}`, inline: true },
        { name: "残高", value: `${user.balance.toLocaleString()}`, inline: true },
        { name: "新しい在庫数", value: `${( (guild.items && guild.items[itemId]?.stock) || (guild.settings?.items && guild.settings.items[itemId]?.stock) || "?" )}`, inline: false }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [okEmbed] });
  }
};
