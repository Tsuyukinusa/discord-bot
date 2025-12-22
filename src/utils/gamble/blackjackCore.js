import { readGuildDB, writeGuildDB } from "../file.js";
import { getGame, saveGame, endGame } from "./blackjackStore.js";
import { drawCard, calcHand, judge } from "./blackjackLogic.js";

function notOwner(game, userId) {
  return game.userId !== userId;
}

function isBlackjack(hand) {
  return hand.length === 2 && calcHand(hand) === 21;
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

  if (calcHand(game.hands[game.currentHand]) > 21) {
    game.finished = true;
    game.result = "lose";
    endGame(guildId, userId);
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

  // ナチュラルブラックジャック
  if (isBlackjack(game.hands[0]) && game.result === "win") {
    user.money += Math.floor(game.bet * 2.5);
  } else {
    if (game.result === "win") user.money += game.bet * 2;
    if (game.result === "push") user.money += game.bet;
  }

  await writeGuildDB(db);
}
