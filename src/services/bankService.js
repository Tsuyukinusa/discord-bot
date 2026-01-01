// src/services/BankServices.js
import { getUser, updateUser } from "../utils/core/file.js";

/**
 * ユーザーデータ初期化
 */
function initUser(guildId, userId) {
    const user = getUser(guildId, userId);

    if (typeof user.balance !== "number") user.balance = 0;
    if (typeof user.bank !== "number") user.bank = 0;

    return user;
}

/**
 * 入金
 * @param {string} guildId
 * @param {string} userId
 * @param {number} amount
 */
export function deposit(guildId, userId, amount) {
    if (amount <= 0) {
        return { success: false, reason: "invalid_amount" };
    }

    const user = initUser(guildId, userId);

    if (user.balance < amount) {
        return { success: false, reason: "not_enough_balance" };
    }

    user.balance -= amount;
    user.bank += amount;

    updateUser(guildId, userId, user);

    return {
        success: true,
        balance: user.balance,
        bank: user.bank
    };
}

/**
 * 引き出し
 * @param {string} guildId
 * @param {string} userId
 * @param {number} amount
 */
export function withdraw(guildId, userId, amount) {
    if (amount <= 0) {
        return { success: false, reason: "invalid_amount" };
    }

    const user = initUser(guildId, userId);

    if (user.bank < amount) {
        return { success: false, reason: "not_enough_bank" };
    }

    user.bank -= amount;
    user.balance += amount;

    updateUser(guildId, userId, user);

    return {
        success: true,
        balance: user.balance,
        bank: user.bank
    };
}

/**
 * 全額入金
 */
export function depositAll(guildId, userId) {
    const user = initUser(guildId, userId);

    if (user.balance <= 0) {
        return { success: false, reason: "nothing_to_deposit" };
    }

    const amount = user.balance;
    user.balance = 0;
    user.bank += amount;

    updateUser(guildId, userId, user);

    return {
        success: true,
        amount,
        balance: user.balance,
        bank: user.bank
    };
}

/**
 * 全額引き出し
 */
export function withdrawAll(guildId, userId) {
    const user = initUser(guildId, userId);

    if (user.bank <= 0) {
        return { success: false, reason: "nothing_to_withdraw" };
    }

    const amount = user.bank;
    user.bank = 0;
    user.balance += amount;

    updateUser(guildId, userId, user);

    return {
        success: true,
        amount,
        balance: user.balance,
        bank: user.bank
    };
}
