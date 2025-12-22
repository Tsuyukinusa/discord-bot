// messageCommands/blackjack.js
import { startBlackjack } from "../utils/gamble/blackjackCore.js";
import { createBlackjackEmbed } from "../utils/gamble/blackjackEmbed.js";
import { blackjackButtons } from "../utils/gamble/blackjackButtons.js";

export default async function blackjackMessage(message, args, client) {
  const bet = Number(args[0]);
  if (!bet || bet <= 0) {
    return message.reply("❌ 賭け金を指定してね");
  }

  const state = startBlackjack(bet);
  client.blackjack = client.blackjack || {};
  client.blackjack[message.author.id] = state;

  await message.reply({
    embeds: [createBlackjackEmbed(state)],
    components: [blackjackButtons()],
  });
}
