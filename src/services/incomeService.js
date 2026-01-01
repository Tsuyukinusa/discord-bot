// utils/services/IncomeServices.js
import { getUser, updateUser } from "../core/file.js";

export function addIncome({
  guildId,
  userId,
  amount,
  source,      // "work" | "crime" | "daily" | "reaction" など
  meta = {}    // 任意（リアクション数、メッセージIDなど）
}) {
  if (amount <= 0) return false;

  const user = getUser(guildId, userId);

  if (typeof user.balance !== "number") user.balance = 0;

  user.balance += amount;

  // ログ用（あとで収入履歴とか作れる）
  if (!user.incomeLog) user.incomeLog = [];
  user.incomeLog.push({
    source,
    amount,
    meta,
    at: Date.now()
  });

  updateUser(guildId, userId, user);
  return true;
}
