import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("slot-symbol")
    .setDescription("スロットの絵文字を管理します")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    .addSubcommand(sc =>
      sc.setName("add")
        .setDescription("シンボルを追加")
        .addStringOption(o =>
          o.setName("emoji")
            .setDescription("絵文字（カスタムOK）")
            .setRequired(true)
        )
        .addNumberOption(o =>
          o.setName("rate2")
            .setDescription("2つ揃い倍率")
            .setRequired(true)
        )
        .addNumberOption(o =>
          o.setName("rate3")
            .setDescription("3つ揃い倍率")
            .setRequired(true)
        )
    )

    .addSubcommand(sc =>
      sc.setName("remove")
        .setDescription("シンボルを削除")
        .addStringOption(o =>
          o.setName("emoji")
            .setDescription("削除する絵文字")
            .setRequired(true)
        )
    )

    .addSubcommand(sc =>
      sc.setName("list")
        .setDescription("登録済みシンボル一覧")
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();
    const db = await readGuildDB();

    if (!db[guildId]) db[guildId] = {};
    if (!db[guildId].slotSymbols) db[guildId].slotSymbols = [];

    const symbols = db[guildId].slotSymbols;

    /* ======================
       ADD
    ====================== */
    if (sub === "add") {
      const emoji = interaction.options.getString("emoji");
      const rate2 = interaction.options.getNumber("rate2");
      const rate3 = interaction.options.getNumber("rate3");

      symbols.push({ emoji, rate2, rate3 });
      await writeGuildDB(db);

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setTitle("✅ シンボル追加")
            .setDescription(`${emoji}\n2揃い: ${rate2}倍\n3揃い: ${rate3}倍`)
        ]
      });
    }

    /* ======================
       REMOVE
    ====================== */
    if (sub === "remove") {
      const emoji = interaction.options.getString("emoji");
      db[guildId].slotSymbols = symbols.filter(s => s.emoji !== emoji);
      await writeGuildDB(db);

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Orange")
            .setDescription(`🗑️ ${emoji} を削除しました`)
        ]
      });
    }

    /* ======================
       LIST
    ====================== */
    if (sub === "list") {
      if (symbols.length === 0) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("Grey")
              .setDescription("登録されているシンボルはありません")
          ]
        });
      }

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("🎰 スロットシンボル一覧")
            .setDescription(
              symbols.map(s =>
                `${s.emoji} ｜ 2揃い ${s.rate2}倍 / 3揃い ${s.rate3}倍`
              ).join("\n")
            )
        ]
      });
    }
  }
};
