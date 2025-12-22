import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const usersPath = path.join(__dirname, "..", "data", "users", "users.json");

// JSON読み込み
function loadUsers() {
    if (!fs.existsSync(usersPath)) {
        fs.writeFileSync(usersPath, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(usersPath, "utf8"));
}

// JSON保存
function saveUsers(data) {
    fs.writeFileSync(usersPath, JSON.stringify(data, null, 2));
}

// 初期値テンプレ（あなたの仕様に基づく）
function defaultUser(userId, guildId) {
    return {
        userId,
        guildId,
        balance: 0,
        bank: 0,
        diamonds: 0, // ガチャダイヤ追加済み
        inventory: [],
        lastUsed: {
            work: 0,
            slut: 0,
            crime: 0
        }
    };
}

// ユーザーデータ取得
export function getUser(userId, guildId) {
    const users = loadUsers();
    const key = `${guildId}-${userId}`;

    if (!users[key]) {
        users[key] = defaultUser(userId, guildId);
        saveUsers(users);
    }
    return users[key];
}

// ユーザーデータ更新
export function updateUser(userId, guildId, newData) {
    const users = loadUsers();
    const key = `${guildId}-${userId}`;

    users[key] = { ...getUser(userId, guildId), ...newData };
    saveUsers(users);
    return users[key];
}
