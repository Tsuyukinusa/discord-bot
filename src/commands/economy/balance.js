import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { readGuildDB } from "../../utils/core/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("あなたのお金・銀行残高・総資産を表示します"),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    const db = await readGuildDB();
    const guild = db[guildId];
    if (!guild || !guild.users || !guild.users[userId]) {
      return interaction.reply({
        content: "❌ ユーザーデータが存在しません。",
        ephemeral: true
      });
    }

    const user = guild.users[userId];

    const balance = user.balance ?? 0;
    const bank = user.bank ?? 0;
    const total = balance + bank;

    /* ======================
       ランキング計算
    ====================== */
    const usersArray = Object.entries(guild.users).map(
      ([id, data]) => ({
        id,
        total: (data.balance ?? 0) + (data.bank ?? 0)
      })
    );

    usersArray.sort((a, b) => b.total - a.total);

    const rank =
      usersArray.findIndex(u => u.id === userId) + 1;
    const totalUsers = usersArray.length;

    /* ======================
       Embed
    ====================== */
    const embed = new EmbedBuilder()
      .setColor("#00c3ff")
      .setTitle(`🏦 ${interaction.user.username} の残高`)
      .setDescription(`**🏆 ランキング:** ${rank}位 / ${totalUsers}人中`)
      .addFields(
        {
          name: "💰 所持金（Wallet）",
          value: `**${balance.toLocaleString()}**`,
          inline: true
        },
        {
          name: "🏛️ 銀行（Bank）",
          value: `**${bank.toLocaleString()}**`,
          inline: true
        },
        {
          name: "💎 総資産（Total）",
          value: `**${total.toLocaleString()}**`,
          inline: false
        }
      )
      .setThumbnail(
        interaction.user.displayAvatarURL({ dynamic: true })
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
