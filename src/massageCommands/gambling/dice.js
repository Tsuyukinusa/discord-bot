// messageCommands/dice.js
import { playDice } from "../utils/gamble/DiceCore.js";
import { createDiceEmbed } from "../utils/gamble/diceEmbed.js";

export default {
  name: "dice",
  async execute(message, args) {
    const [count, type, bet] = args;

    const result = await playDice({
      guildId: message.guild.id,
      userId: message.author.id,
      diceCount: Number(count),
      betType: type,
      bet: Number(bet)
    });

    if (result.error) {
      return message.reply(`❌ ${result.error}`);
    }

    return message.reply({ embeds: [createDiceEmbed(result)] });
  }
};
