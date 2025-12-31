import {
  joinRoulette,
  getRoulette
} from "../utils/gamble/roulette/rouletteCore.js";
import { createRouletteWaitingEmbed } from "../utils/gamble/roulette/rouletteEmbed.js";

export default {
  name: "roulette",

  async execute(message, args) {
    const [amountArg, type, value] = args;

    const amount =
      amountArg === "half" || amountArg === "all"
        ? amountArg
        : Number(amountArg);

    const bet = {
      amount,
      type,
      value: value ? Number(value) : null
    };

    const result = await joinRoulette({
      guildId: message.guild.id,
      userId: message.author.id,
      bet
    });

    if (result?.error) {
      return message.reply(result.error);
    }

    return message.reply({
      embeds: [createRouletteWaitingEmbed(getRoulette(message.guild.id))]
    });
  }
};
