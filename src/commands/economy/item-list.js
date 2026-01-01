import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";
import { readGuildDB } from "../../utils/core/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("item-list")
    .setDescription("アイテム一覧をページで表示します"),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const db = await readGuildDB();

    if (!db[guildId]?.items || Object.keys(db[guildId].items).length === 0) {
      return interaction.reply({
        content: "📭 アイテムがありません。",
        ephemeral: true
      });
    }

    // Object → Array
    const items = Object.entries(db[guildId].items).map(
      ([id, data]) => ({ id, ...data })
    );

    let page = 0;
    const perPage = 5;
    const maxPage = Math.ceil(items.length / perPage);

    const buildEmbed = (pageIndex) => {
      const start = pageIndex * perPage;
      const end = start + perPage;
      const pageItems = items.slice(start, end);

      const embed = new EmbedBuilder()
        .setTitle("📦 アイテム一覧")
        .setColor("#00bfff")
        .setFooter({ text: `ページ ${pageIndex + 1} / ${maxPage}` });

      for (const item of pageItems) {
        embed.addFields({
          name: `🆔 ${item.id}｜${item.name}`,
          value:
            `📄 ${item.description || "説明なし"}\n` +
            `🧩 種類：${item.type}\n` +
            `💰 売値：${item.sellPrice ?? "なし"}\n` +
            `📦 在庫：${item.type === "role" ? "無限" : (item.stock ?? 0)}`,
          inline: false
        });
      }

      return embed;
    };

    const buildButtons = (pageIndex) =>
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("itemlist-prev")
          .setLabel("⬅ 前へ")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(pageIndex === 0),

        new ButtonBuilder()
          .setCustomId("itemlist-next")
          .setLabel("次へ ➡")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(pageIndex >= maxPage - 1)
      );

    await interaction.reply({
      embeds: [buildEmbed(page)],
      components: [buildButtons(page)]
    });

    const collector = interaction.channel.createMessageComponentCollector({
      time: 60_000
    });

    collector.on("collect", async (btn) => {
      if (btn.user.id !== interaction.user.id) {
        return btn.reply({
          content: "❌ あなたの操作ではありません。",
          ephemeral: true
        });
      }

      if (btn.customId === "itemlist-prev" && page > 0) page--;
      if (btn.customId === "itemlist-next" && page < maxPage - 1) page++;

      await btn.update({
        embeds: [buildEmbed(page)],
        components: [buildButtons(page)]
      });
    });

    collector.on("end", async () => {
      await interaction.editReply({ components: [] });
    });
  }
};
