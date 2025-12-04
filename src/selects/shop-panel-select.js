// src/selects/shop-panel-select.js
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
  customId: "shop-panel-select",

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const channelId = interaction.channel.id;
    const selectedItems = interaction.values; // 選択された itemId の配列

    const db = await readGuildDB();
    if (!db[guildId]) db[guildId] = {};
    if (!db[guildId].items) db[guildId].items = {};
    if (!db[guildId].shopPanels) db[guildId].shopPanels = {};

    // --- パネル情報保存（チャンネル単位） ---
    db[guildId].shopPanels[channelId] = {
      items: selectedItems,
      createdAt: Date.now()
    };
    await writeGuildDB(db);

    // --- 埋め込み生成（選ばれたアイテムの詳細を列挙） ---
    const embed = new EmbedBuilder()
      .setColor("#00b5ff")
      .setTitle("🛒 ショップパネル")
      .setDescription("下のボタンから購入できます（ボタンは在庫が 0 の場合無効になります）。")
      .setFooter({ text: "ショップパネル" });

    // 各アイテムの説明を embed に追加
    const fields = [];
    selectedItems.forEach((id) => {
      const item = db[guildId].items[id];
      if (!item) return; // 存在しない id は無視
      const stockText = item.stock === null ? "無制限" : `${item.stock}`;
      fields.push({
        name: `${item.name} (${id})`,
        value: `価格: **${item.sellPrice.toLocaleString()}**\n在庫: **${stockText}**\n${item.description || ""}`,
        inline: false
      });
    });
    if (fields.length > 0) embed.addFields(fields);

    // --- ボタン行作成（1行につき最大5ボタン） ---
    const buttons = [];
    const visibleButtons = selectedItems
      .map((id) => ({ id, item: db[guildId].items[id] }))
      .filter((x) => x.item); // 存在しないアイテムは除外

    // create rows of up to 5 buttons
    for (let i = 0; i < visibleButtons.length; i += 5) {
      const slice = visibleButtons.slice(i, i + 5);
      const row = new ActionRowBuilder();
      slice.forEach(({ id, item }) => {
        const disabled = item.stock !== null && item.stock <= 0;
        const labelName = `${item.name}${item.sellPrice ? ` — ${item.sellPrice}` : ""}`;
        const btn = new ButtonBuilder()
          .setCustomId(`buyItem_${id}`) // interactionCreate と合わせる
          .setLabel(labelName.substring(0, 80)) // ラベル長制限に配慮
          .setStyle(ButtonStyle.Primary)
          .setDisabled(Boolean(disabled));
        row.addComponents(btn);
      });
      buttons.push(row);
    }

    // ===== 重要 =====
    // セレクトに対して「確認メッセージ」を出したくない場合は deferUpdate を使って静かに承認する
    await interaction.deferUpdate();

    // --- チャンネルにパネルを送信 ---
    await interaction.channel.send({
      embeds: [embed],
      components: buttons
    });

    // （返信は不要なのでここで終わり）
  }
};
