import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "guilds.json");

// -----------------------------
// JSONデータ読み込み
// -----------------------------
function load() {
    if (!fs.existsSync(filePath)) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
    }
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

// -----------------------------
// JSONデータ保存
// -----------------------------
function save(data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// -----------------------------
// デフォルト設定
// -----------------------------
const defaultSettings = {
    diamond: { min: 10, max: 50 },
    fine: { min: 5, max: 20 },
    cooldown: {
        work: 30,
        slut: 30,
        crime: 30
    }
};

// -----------------------------
// ギルド取得（なければ作成）
// -----------------------------
export function getGuild(guildId) {
    const db = load();

    // 初回ならデフォルト作成
    if (!db[guildId]) {
        db[guildId] = {
            settings: JSON.parse(JSON.stringify(defaultSettings))
        };
        save(db);
    }

    return db[guildId];
}

// -----------------------------
// ギルド設定の部分更新
// -----------------------------
export function updateGuild(guildId, newData) {
    const db = load();

    // ギルドが存在しない場合は初期化
    if (!db[guildId]) {
        db[guildId] = {
            settings: JSON.parse(JSON.stringify(defaultSettings))
        };
    }

    // 深いマージ
    db[guildId] = deepMerge(db[guildId], newData);

    save(db);
}

// -----------------------------
// 深いマージ（settings内だけ更新して保持）
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
// 設定リセット（デフォルトに戻す）
// -----------------------------
export function resetGuild(guildId) {
    const db = load();
    db[guildId] = {
        settings: JSON.parse(JSON.stringify(defaultSettings))
    };
    save(db);
}

// -----------------------------
// 全ギルドのデータ取得（管理ツールなど向け）
// -----------------------------
export function getAllGuilds() {
    return load();
}
