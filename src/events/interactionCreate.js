export default {
  name: "interactionCreate",
  async execute(interaction, client) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
          return interaction.reply({
            content: "❌ このコマンドは存在しません。",
            ephemeral: true,
          });
        }

        await command.execute(interaction, client);
        return;
      }

      if (interaction.isButton()) {
        const [prefix] = interaction.customId.split(":");
        const handler = client.buttonHandlers?.get(prefix);
        if (handler) return handler(interaction, client);
      }

      if (interaction.isStringSelectMenu()) {
        const handler = client.selectHandlers?.get(interaction.customId);
        if (handler) return handler(interaction, client);
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
