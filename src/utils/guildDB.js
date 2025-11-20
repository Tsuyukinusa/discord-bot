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
        startBalance: 0,

        incomeRoles: {},        // roleId: moneyAmount
        cooldowns: {            // コマンドのクールダウン
            work: 300000,
            slut: 300000,
            crime: 300000
        },

        work: {
            min: 50,
            max: 200
        },
        slut: {
            min: 100,
            max: 300,
            failMin: 10,
            failMax: 80,
            failRate: 30
        },
        crime: {
            min: 150,
            max: 500,
            failMin: 20,
            failMax: 120,
            failRate: 40
        },

        interestRate: 1.2,    // 金利
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
