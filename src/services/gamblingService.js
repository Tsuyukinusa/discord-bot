// src/services/GamblingServices.js
import { getUser, updateUser } from "../utils/core/file.js";

/**
 * 賭博系共通処理
 */
export const GamblingServices = {

    /**
     * 賭け金を支払えるかチェック
     */
    canBet(guildId, userId, bet) {
        const user = getUser(guildId, userId);
        if (!user || user.balance < bet || bet <= 0) {
            return false;
        }
        return true;
    },

    /**
     * 賭け金を引く
     */
    takeBet(guildId, userId, bet) {
        const user = getUser(guildId, userId);
        user.balance -= bet;
        updateUser(guildId, userId, user);
    },

    /**
     * 勝利時の支払い
     */
    payout(guildId, userId, amount) {
        const user = getUser(guildId, userId);
        user.balance += amount;
        updateUser(guildId, userId, user);
    },

    /**
     * 勝敗結果をまとめて処理
     */
    resolveResult({ guildId, userId, bet, win, multiplier }) {
        const user = getUser(guildId, userId);

        // 先に賭け金を引く
        user.balance -= bet;

        let payout = 0;

        if (win) {
            payout = Math.floor(bet * multiplier);
            user.balance += payout;
        }

        updateUser(guildId, userId, user);

        return {
            win,
            bet,
            payout,
            balance: user.balance
        };
    }
};
