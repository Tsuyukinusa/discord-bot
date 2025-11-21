import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "guilds.json");

// -----------------------------
// JSON読み込み
// -----------------------------
function load() {
    if (!fs.existsSync(filePath)) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
    }
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

// -----------------------------
// JSON保存
// -----------------------------
function save(data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// -----------------------------
// デフォルト設定
// -----------------------------
const defaultSettings = {
    work: {
        moneyMin: 1200,
        moneyMax: 2000,
        diamondMin: 1,
        diamondMax: 3
    },

    slut: {
        moneyMin: 1800,
        moneyMax: 2600,
        failMoneyMin: 1000,
        failMoneyMax: 1500,
        diamondMin: 2,
        diamondMax: 4
    },

    crime: {
        moneyMin: 6000,
        moneyMax: 10000,
        failMoneyMin: 10000,
        failMoneyMax: 20000,
        diamondMin: 3,
        diamondMax: 7
    },

    cooldown: {
        work: 30,
        slut: 30,
        crime: 30
    }
};

// -----------------------------
// ギルド取得
// -----------------------------
export function getGuild(guildId) {
    const db = load();

    if (!db[guildId]) {
        db[guildId] = {
            settings: JSON.parse(JSON.stringify(defaultSettings))
        };
        save(db);
    }

    return db[guildId];
}

// -----------------------------
// ギルド設定更新
// -----------------------------
export function updateGuild(guildId, newData) {
    const db = load();

    if (!db[guildId]) {
        db[guildId] = {
            settings: JSON.parse(JSON.stringify(defaultSettings))
        };
    }

    db[guildId] = deepMerge(db[guildId], newData);
    save(db);
}

// -----------------------------
// 深いマージ
// -----------------------------
function deepMerge(target, source) {
    for (const key of Object.keys(source)) {
        if (
            typeof target[key] === "object" &&
            typeof source[key] === "object" &&
            !Array.isArray(target[key])
        ) {
            target[key] = deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

// -----------------------------
// デフォルトにリセット
// -----------------------------
export function resetGuild(guildId) {
    const db = load();
    db[guildId] = {
        settings: JSON.parse(JSON.stringify(defaultSettings))
    };
    save(db);
}

// -----------------------------
// 全ギルド取得
// -----------------------------
export function getAllGuilds() {
    return load();
}
