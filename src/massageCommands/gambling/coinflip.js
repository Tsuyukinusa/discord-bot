// messageCommands/gamble/coinflip.js
import { EmbedBuilder } from "discord.js";
import { playCoinflip } from "../../utils/gamble/coinflip/coinflipCore.js";

export default {
  name: "coinflip",

  async execute(message, args) {
    const guildId = message.guild.id;
    const userId = message.author.id;

    const choiceArg = args[0];
    const bet = Number(args[1]);

    if (!choiceArg || isNaN(bet)) {
      const embed = new EmbedBuilder()
        .setColor("#ff5252")
        .setTitle("❌ 使い方エラー")
        .setDescription("`!coinflip 表 100` のように使ってぬさ");

      return message.reply({ embeds: [embed] });
    }

    const choice =
      choiceArg === "表" ? "heads" :
      choiceArg === "裏" ? "tails" :
      null;

    if (!choice) {
      const embed = new EmbedBuilder()
        .setColor("#ff5252")
        .setTitle("❌ 入力エラー")
        .setDescription("表 または 裏 を指定してくださいぬさ");

      return message.reply({ embeds: [embed] });
    }

    const result = playCoinflip({ guildId, userId, bet, choice });

    // ❌ エラー
    if (result.error) {
      const embed = new EmbedBuilder()
        .setColor("#ff5252")
        .setTitle("❌ コイン投げ失敗")
        .setDescription(result.error);

      return message.reply({ embeds: [embed] });
    }

    // ✅ 成功
    const embed = new EmbedBuilder()
      .setColor(result.win ? "#4caf50" : "#ff9800")
      .setTitle("🪙 コイン投げ結果")
      .addFields(
        { name: "あなたの選択", value: choice === "heads" ? "表" : "裏", inline: true },
        { name: "結果", value: result.result === "heads" ? "表" : "裏", inline: true },
        { name: "賭け金", value: `${bet}`, inline: true },
        { name: "結果", value: result.win ? "🎉 勝ち！" : "💥 負け…" },
        { name: "現在の所持金", value: `${result.money}` }
      )
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }
};
