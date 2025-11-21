import { SlashCommandBuilder } from "discord.js";
import { getUser, getAllUsers } from "../../utils/userdb.js";

export default {
    data: new SlashCommandBuilder()
        .setName("balance")
        .setDescription("あなたのお金・銀行残高・総資産を表示します"),

    async execute(interaction) {

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        // ユーザーデータ取得
        const user = getUser(guildId, userId);

        if (!user.money) user.money = 0;
        if (!user.bank) user.bank = 0;

        const total = user.money + user.bank;

        // --- ランキング計算 ---
        const allUsers = getAllUsers()[guildId] || {};
        const usersArray = Object.entries(allUsers).map(([id, data]) => ({
            id,
            total: (data.money || 0) + (data.bank || 0)
        }));

        usersArray.sort((a, b) => b.total - a.total);

        const rank = usersArray.findIndex(u => u.id === userId) + 1;
        const totalUsers = usersArray.length;

        // --- 表示 ---
        const msg =
`🏆 **サーバー内総資産ランキング:** **${rank}位 / ${totalUsers}人中**

**💰 あなたの資産状況**
所持金（Wallet）: **${user.money.toLocaleString()}**
銀行預金（Bank）: **${user.bank.toLocaleString()}**
総資産（Total）: **${total.toLocaleString()}**
`;

        await interaction.reply(msg);
    }
};
