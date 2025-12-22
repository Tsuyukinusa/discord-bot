// messageCommands/gamble/coinflip.js
import { playCoinflip } from "../../utils/gamble/coinflipCore.js";

export async function execute(message, args) {
  const bet = Number(args[0]);
  const choice = args[1];

  const result = playCoinflip({
    guildId: message.guild.id,
    userId: message.author.id,
    bet,
    choice
  });

  if (result.error) {
    return message.reply(result.error);
  }

  return message.reply(
    `🪙 結果: ${result.result}\n` +
    (result.win ? "🎉 勝ち！" : "💀 負け…")
  );
}
