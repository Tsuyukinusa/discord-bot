// utils/blackjackCore.js
import { readGuildDB, writeGuildDB } from "./file.js";
import { getGame, saveGame, endGame } from "./blackjackStore.js";
import { drawCard, calcHand, judge } from "./blackjackLogic.js";

function notOwner(game, userId) {
  return game.userId !== userId;
}

/* ======================
   HIT
====================== */
export async function playHit(guildId, userId) {
  const game = getGame(guildId, userId);
  if (!game) return { error: "ゲームが存在しません" };
  if (notOwner(game, userId)) return { error: "あなたのゲームではありません" };
  if (game.finished) return { error: "ゲームは終了しています" };

  game.hands[game.currentHand].push(drawCard());

  // バースト判定
  if (calcHand(game.hands[game.currentHand]) > 21) {
    // スプリット時は次の手へ
    if (game.split && game.currentHand === 0) {
      game.currentHand = 1;
    } else {
      game.finished = true;
      game.result = "lose";
      endGame(guildId, userId);
    }
  }

  saveGame(guildId, userId, game);
  return game;
}

/* ======================
   STAND
====================== */
export async function playStand(guildId, userId) {
  const game = getGame(guildId, userId);
  if (!game) return { error: "ゲームが存在しません" };
  if (notOwner(game, userId)) return { error: "あなたのゲームではありません" };
  if (game.finished) return { error: "ゲームは終了しています" };

  // スプリット中：次の手へ
  if (game.split && game.currentHand === 0) {
    game.currentHand = 1;
    saveGame(guildId, userId, game);
    return game;
  }

  // ディーラーは17以上で停止
  while (calcHand(game.dealer) < 17) {
    game.dealer.push(drawCard());
  }

  game.finished = true;
  game.result = judge(game);
  await payout(guildId, userId, game);

  endGame(guildId, userId);
  return game;
}

/* ======================
   DOUBLE DOWN
====================== */
export async function playDouble(guildId, userId) {
  const game = getGame(guildId, userId);
  if (!game) return { error: "ゲームが存在しません" };
  if (notOwner(game, userId)) return { error: "あなたのゲームではありません" };
  if (game.doubled) return { error: "すでにダブルしています" };
  if (game.split) return { error: "スプリット中はダブルできません" };

  const db = await readGuildDB();
  const user = db[guildId].users[userId];

  if (user.money < game.bet) {
    return { error: "ダブルダウンするお金が足りません" };
  }

  user.money -= game.bet;
  game.bet *= 2;
  game.doubled = true;

  game.hands[game.currentHand].push(drawCard());

  await writeGuildDB(db);
  return playStand(guildId, userId);
}

/* ======================
   SPLIT
====================== */
export async function playSplit(guildId, userId) {
  const game = getGame(guildId, userId);
  if (!game) return { error: "ゲームが存在しません" };
  if (notOwner(game, userId)) return { error: "あなたのゲームではありません" };
  if (game.split) return { error: "すでにスプリットしています" };

  const hand = game.hands[0];
  if (hand.length !== 2 || hand[0].value !== hand[1].value) {
    return { error: "スプリットできません" };
  }

  const db = await readGuildDB();
  const user = db[guildId].users[userId];

  if (user.money < game.bet) {
    return { error: "スプリットするお金が足りません" };
  }

  user.money -= game.bet;

  game.hands = [
    [hand[0], drawCard()],
    [hand[1], drawCard()]
  ];
  game.currentHand = 0;
  game.split = true;

  await writeGuildDB(db);
  saveGame(guildId, userId, game);
  return game;
}

/* ======================
   払い戻し
====================== */
async function payout(guildId, userId, game) {
  const db = await readGuildDB();
  const user = db[guildId].users[userId];

  if (game.result === "win") user.money += game.bet * 2;
  if (game.result === "push") user.money += game.bet;

  await writeGuildDB(db);
}
