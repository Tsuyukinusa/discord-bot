import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";
import { buildLeaderboardEmbed } from "../utils/economy/buildLeaderboardEmbed.js";

export default async function rankPageButtonHandler(interaction) {
  const [action, currentPage] = interaction.customId.split(":");
  let page = Number(currentPage);

  if (action === "rank-prev") page--;
  if (action === "rank-next") page++;

  const guildId = interaction.guild.id;
  const { embed, maxPage } = buildLeaderboardEmbed(guildId, page);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`rank-prev:${page}`)
      .setLabel("◀")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),

    new ButtonBuilder()
      .setCustomId(`rank-next:${page}`)
      .setLabel("▶")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= maxPage)
  );

  await interaction.update({
    embeds: [embed],
    components: [row],
  });
}
