import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getUser, updateUser } from "../../utils/userdb.js";
import { getGuild } from "../../utils/guildDB.js";

export default {
    data: new SlashCommandBuilder()
        .setName("inventory")
        .setDescription("あなたの所持アイテムを表示します"),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        const user = getUser(guildId, userId);
        const guild = getGuild(guildId);

        // インベントリが空なら
        if (!user.inventory || Object.keys(user.inventory).length === 0) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("🎒 インベントリ")
                        .setColor("#ffb6c1")
                        .setDescription("所持アイテムがありません。")
                ]
            });
        }

        const items = guild.items || {};

        // インベントリをリスト化
        let list = "";
        for (const itemId in user.inventory) {
            const count = user.inventory[itemId];
            const data = items[itemId];

            if (!data) continue; // アイテムが削除されていた場合

            list += `**${data.name}** × ${count}\n`;
        }

        if (list === "") list = "所持アイテムがありません。";

        const embed = new EmbedBuilder()
            .setTitle(`🎒 ${interaction.user.username} のインベントリ`)
            .setColor("#00aaff")
            .setDescription(list)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
