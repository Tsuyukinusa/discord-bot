import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const guildsPath = path.join(__dirname, "..", "data", "guilds", "guilds.json");

// JSON読み込み
function loadGuilds() {
    if (!fs.existsSync(guildsPath)) {
        fs.writeFileSync(guildsPath, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(guildsPath, "utf8"));
}

// JSON保存
function saveGuilds(data) {
    fs.writeFileSync(guildsPath, JSON.stringify(data, null, 2));
}

// 初期値テンプレ（あなたの仕様に基づく）
function defaultGuild(guildId) {
    return {
        guildId,
        currency: "💰",
        startBalance: 1000,

        incomeRoles: {},        // roleId: moneyAmount
        cooldowns: {            // コマンドのクールダウン
            work: 300000,
            slut: 300000,
            crime: 300000
        },

        work: {
            min: 1200,
            max: 2000
        },
        slut: {
            min: 1800,
            max: 2600,
            failMin: 1000,
            failMax: 1500,
            failRate: 0
        },
        crime: {
            min: 6000,
            max: 10000,
            failMin: 10000,
            failMax: 20000,
            failRate: 0
        },

        interestRate: 0.6,    // 金利
    };
}

// ギルドデータ取得
export function getGuild(guildId) {
    const guilds = loadGuilds();
    if (!guilds[guildId]) {
        guilds[guildId] = defaultGuild(guildId);
        saveGuilds(guilds);
    }
    return guilds[guildId];
}

// ギルドデータ更新
export function updateGuild(guildId, newData) {
    const guilds = loadGuilds();
    guilds[guildId] = { ...getGuild(guildId), ...newData };
    saveGuilds(guilds);
    return guilds[guildId];
}
