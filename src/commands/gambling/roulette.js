import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import {
  joinRoulette,
  getRoulette
} from "../../utils/gamble/rouletteCore.js";
import { createRouletteWaitingEmbed } from "../../utils/gamble/rouletteEmbed.js";

export default {
  data: new SlashCommandBuilder()
    .setName("roulette")
    .setDescription("ルーレットに参加します")
    .addStringOption(o =>
      o.setName("bet")
        .setDescription("賭け金（数字 / half / all）")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("type")
        .setDescription("賭け方")
        .setRequired(true)
        .addChoices(
          { name: "赤", value: "red" },
          { name: "黒", value: "black" },
          { name: "奇数", value: "odd" },
          { name: "偶数", value: "even" },
          { name: "High", value: "high" },
          { name: "Low", value: "low" },
          { name: "数字", value: "number" }
        )
    )
    .addIntegerOption(o =>
      o.setName("number")
        .setDescription("数字（number時）")
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    const betInput = interaction.options.getString("bet");
    const amount =
      betInput === "half" || betInput === "all"
        ? betInput
        : Number(betInput);

    const bet = {
      amount,
      type: interaction.options.getString("type"),
      value: interaction.options.getInteger("number")
    };

    const result = await joinRoulette({ guildId, userId, bet });

    if (result?.error) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(result.error)
        ],
        ephemeral: true
      });
    }

    return interaction.reply({
      embeds: [createRouletteWaitingEmbed(getRoulette(guildId))]
    });
  }
};
