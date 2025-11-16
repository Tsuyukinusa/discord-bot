export default {
  name: "interactionCreate",
  async execute(interaction, client) {
    try {
      // ===== スラッシュコマンド処理 =====
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
          return interaction.reply({
            content: "❌ このコマンドは存在しません。",
            ephemeral: true,
          });
        }

        await command.execute(interaction, client);
      }

      // ===== ボタン処理（今後ジャックポット、ガチャなどで使用）=====
      if (interaction.isButton()) {
        const customId = interaction.customId;

        // ボタンに customHandlers が用意される前提（あとで追加）
        const handler = client.buttonHandlers?.get(customId);
        if (handler) {
          return handler(interaction, client);
        }
      }

      // ===== セレクトメニュー処理 =====
      if (interaction.isStringSelectMenu()) {
        const customId = interaction.customId;

        const handler = client.selectHandlers?.get(customId);
        if (handler) {
          return handler(interaction, client);
        }
      }
    } catch (error) {
      console.error("❌ interactionCreate エラー:", error);

      if (interaction.replied || interaction.deferred) {
        return interaction.followUp({
          content: "⚠ コマンド処理中にエラーが発生しました。",
          ephemeral: true,
        });
      } else {
        return interaction.reply({
          content: "⚠ コマンド処理中にエラーが発生しました。",
          ephemeral: true,
        });
      }
    }
  },
};
