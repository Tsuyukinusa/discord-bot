import fs from "fs";
import path from "path";

const usersPath = path.join(process.cwd(), "src", "data", "users");

function getUserFile(userId) {
    return path.join(usersPath, `${userId}.json`);
}

function createUser(userId) {
    return {
        id: userId,
        balance: 0,        // 所持金
        bank: 0,           // 銀行残高
        diamond: 0,        // ダイヤ
        items: {},         // { itemId: 個数 }
        lastWorked: 0,     // /work クールダウン用
        lastSlut: 0,       // /slut クールダウン用
        lastCrime: 0,      // /crime クールダウン用
    };
}

export function getUser(userId) {
    const file = getUserFile(userId);

    if (!fs.existsSync(file)) {
        const newUser = createUser(userId);
        fs.writeFileSync(file, JSON.stringify(newUser, null, 4));
        return newUser;
    }

    const data = fs.readFileSync(file);
    return JSON.parse(data);
}

export function saveUser(userId, data) {
    const file = getUserFile(userId);
    fs.writeFileSync(file, JSON.stringify(data, null, 4));
}

export function addMoney(userId, amount) {
    const user = getUser(userId);
    user.balance += amount;
    saveUser(userId, user);
    return user.balance;
}

export function removeMoney(userId, amount) {
    const user = getUser(userId);
    user.balance = Math.max(0, user.balance - amount);
    saveUser(userId, user);
    return user.balance;
}

export function addDiamond(userId, amount) {
    const user = getUser(userId);
    user.diamond += amount;
    saveUser(userId, user);
    return user.diamond;
}

export function addItem(userId, itemId, count = 1) {
    const user = getUser(userId);
    if (!user.items[itemId]) user.items[itemId] = 0;
    user.items[itemId] += count;
    saveUser(userId, user);
    return user.items[itemId];
}

export function removeItem(userId, itemId, count = 1) {
    const user = getUser(userId);
    if (!user.items[itemId]) return 0;

    user.items[itemId] -= count;
    if (user.items[itemId] <= 0) delete user.items[itemId];

    saveUser(userId, user);
    return user.items[itemId] || 0;
}
