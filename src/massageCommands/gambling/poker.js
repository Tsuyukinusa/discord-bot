import { playPoker } from "../utils/gamble/pokerCore.js";
import { createPokerEmbed } from "../utils/gamble/pokerEmbed.js";

export default {
  name: "poker",
  async execute(message, args) {
    const bet = Number(args[0]);
    if (!bet || bet <= 0) {
      return message.reply("賭け金を数字で指定してね");
    }

    const result = await playPoker({
      guildId: message.guild.id,
      userId: message.author.id,
      bet
    });

    if (result.error) {
      return message.reply(result.error);
    }

    return message.reply({
      embeds: [createPokerEmbed(result)]
    });
  }
};
