import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

export default async function rankPageButtonHandler(interaction, client) {
  const [action, currentPage] = interaction.customId.split(":");
  let page = Number(currentPage);

  if (action === "rank-prev") page--;
  if (action === "rank-next") page++;

  const embed = new EmbedBuilder()
    .setTitle(`🏆 ランキング - ページ ${page}`)
    .setDescription(`←▶ ページング成功！今はページ ${page} です。`)
    .setColor("Gold");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`rank-prev:${page}`)
      .setLabel("◀")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page <= 1),

    new ButtonBuilder()
      .setCustomId(`rank-next:${page}`)
      .setLabel("▶")
      .setStyle(ButtonStyle.Primary)
  );

  await interaction.update({
    embeds: [embed],
    components: [row],
  });
}
