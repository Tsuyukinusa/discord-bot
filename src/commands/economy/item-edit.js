
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getGuild, updateGuild } from "../../utils/core/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("item-edit")
        .setDescription("アイテム情報を変更します（管理者専用）")
        .addStringOption(opt =>
            opt.setName("id")
                .setDescription("編集するアイテムID")
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName("name")
                .setDescription("新しいアイテム名（任意）")
        )
        .addIntegerOption(opt =>
            opt.setName("sell")
                .setDescription("新しい売値（任意）")
        )
        .addStringOption(opt =>
            opt.setName("effect")
                .setDescription("新しい効果（任意）")
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const id = interaction.options.getString("id");

        const newName = interaction.options.getString("name");
        const newSell = interaction.options.getInteger("sell");
        const newEffect = interaction.options.getString("effect");

        const guild = getGuild(guildId);

        if (!guild.items || !guild.items[id]) {
            return interaction.reply({
                content: "❌ そのIDのアイテムは存在しません。",
                ephemeral: true
            });
        }

        const item = guild.items[id];

        if (newName) item.name = newName;
        if (newSell !== null) item.sell = newSell;
        if (newEffect) item.effect = newEffect;

        updateGuild(guildId, guild);

        const embed = new EmbedBuilder()
            .setTitle("🛠 アイテムを更新しました")
            .setColor("#00ff88")
            .addFields(
                { name: "ID", value: id, inline: true },
                { name: "名前", value: item.name, inline: true },
                { name: "売値", value: String(item.sell), inline: true },
                { name: "効果", value: item.effect || "なし", inline: false }
            );

        return interaction.reply({ embeds: [embed] });
    }
};
