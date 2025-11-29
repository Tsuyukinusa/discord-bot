import {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    TextInputStyle,
    PermissionFlagsBits,
    EmbedBuilder
} from "discord.js";
import { getGuild, updateGuild } from "../../utils/guildDB.js";

export default {
    data: new SlashCommandBuilder()
        .setName("item-create")
        .setDescription("新しいアイテムを作成します（誰でも）"),

    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId("itemCreateModal")
            .setTitle("🛒 アイテム作成");

        const nameInput = new TextInputBuilder()
            .setCustomId("itemName")
            .setLabel("アイテム名")
            .setRequired(true)
            .setStyle(TextInputStyle.Short);

        const idInput = new TextInputBuilder()
            .setCustomId("itemId")
            .setLabel("アイテムID（例: A001）")
            .setRequired(true)
            .setStyle(TextInputStyle.Short);

        const typeInput = new TextInputBuilder()
            .setCustomId("itemType")
            .setLabel("効果タイプ（money / xp / role）")
            .setRequired(true)
            .setStyle(TextInputStyle.Short);

        const sellInput = new TextInputBuilder()
            .setCustomId("itemPrice")
            .setLabel("売値（数字）")
            .setRequired(true)
            .setStyle(TextInputStyle.Short);

        const descInput = new TextInputBuilder()
            .setCustomId("itemDesc")
            .setLabel("効果を表す説明文")
            .setRequired(true)
            .setStyle(TextInputStyle.Paragraph);

        modal.addComponents(
            new ActionRowBuilder().addComponents(nameInput),
            new ActionRowBuilder().addComponents(idInput),
            new ActionRowBuilder().addComponents(typeInput),
            new ActionRowBuilder().addComponents(sellInput),
            new ActionRowBuilder().addComponents(descInput)
        );

        await interaction.showModal(modal);
    },

    async modal(interaction) {
        if (interaction.customId !== "itemCreateModal") return;

        const guildId = interaction.guild.id;
        const guild = getGuild(guildId);

        if (!guild.items) guild.items = {};

        const name = interaction.fields.getTextInputValue("itemName");
        const itemId = interaction.fields.getTextInputValue("itemId");
        const type = interaction.fields.getTextInputValue("itemType").toLowerCase();
        const price = parseInt(interaction.fields.getTextInputValue("itemPrice"));
        const description = interaction.fields.getTextInputValue("itemDesc");

        // ==== バリデーション ====
        if (guild.items[itemId]) {
            return interaction.reply({
                content: "❌ そのアイテムIDはすでに存在します。",
                ephemeral: true
            });
        }

        if (!["money", "xp", "role"].includes(type)) {
            return interaction.reply({
                content: "❌ 効果タイプは **money / xp / role** のいずれかを入力してください。",
                ephemeral: true
            });
        }

        if (isNaN(price) || price < 0) {
            return interaction.reply({
                content: "❌ 売値は 0 以上の数字を入力してください。",
                ephemeral: true
            });
        }

        // ========= ROLE アイテムの特別処理 =========
        let cost = 0;
        let stock = -1; // -1 = 無限

        if (type === "role") {
            const forbidden = ["Admin", "Administrator", "Moderator", "Mod"];

            if (forbidden.some(r => name.toLowerCase().includes(r.toLowerCase()))) {
                return interaction.reply({
                    content: "❌ 管理者・モデレーターロールはアイテムにできません。",
                    ephemeral: true
                });
            }
        } else {
            // money or xp → 原価が必要
            cost = Math.floor(price * 0.6); // 原価は売値の6割など自由に調整OK
            stock = 0;
        }

        guild.items[itemId] = {
            name,
            itemId,
            type,
            price,
            cost,
            stock,
            description,
            creator: interaction.user.id,
            createdAt: Date.now()
        };

        updateGuild(guildId, guild);

        // ===== 埋め込み返信 =====
        const embed = new EmbedBuilder()
            .setTitle("🛒 アイテム作成完了")
            .setColor("#00ffb7")
            .addFields(
                { name: "📌 アイテム名", value: name },
                { name: "🆔 ID", value: itemId },
                { name: "🎯 効果タイプ", value: type },
                { name: "💵 売値", value: `${price}` },
                { name: "📦 在庫", value: stock === -1 ? "∞（ロールアイテム）" : `${stock}` },
                { name: "📝 効果説明", value: description },
            );

        return interaction.reply({ embeds: [embed] });
    }
};
