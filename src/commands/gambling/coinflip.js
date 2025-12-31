// commands/gamble/coinflip.js
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { playCoinflip } from "../../utils/gamble/coinflip/coinflipCore.js";

export default {
  data: new SlashCommandBuilder()
    .setName("coinflip")
    .setDescription("コイン投げギャンブル")
    .addIntegerOption(o =>
      o.setName("bet")
        .setDescription("賭け金")
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption(o =>
      o.setName("choice")
        .setDescription("表か裏")
        .setRequired(true)
        .addChoices(
          { name: "表", value: "heads" },
          { name: "裏", value: "tails" }
        )
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const bet = interaction.options.getInteger("bet");
    const choice = interaction.options.getString("choice");

    const result = playCoinflip({ guildId, userId, bet, choice });

    // ❌ エラー
    if (result.error) {
      const embed = new EmbedBuilder()
        .setColor("#ff5252")
        .setTitle("❌ コイン投げ失敗")
        .setDescription(result.error);

      return interaction.reply({ embeds: [embed], ephemeral: true });
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

    return interaction.reply({ embeds: [embed] });
  }
};
