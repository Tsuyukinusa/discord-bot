import { readGuildDB, writeGuildDB } from "../utils/core/file.js";
import { getGame, saveGame, endGame } from "./blackjackStore.js";
import { drawCard, calcHand } from "./blackjackLogic.js";

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
    if (game.split && game.currentHand === 0) {
      game.currentHand = 1;
    } else {
      game.finished = true;
      game.result = "lose";
      await payout(guildId, userId, game);
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

  if (game.split && game.currentHand === 0) {
    game.currentHand = 1;
    saveGame(guildId, userId, game);
    return game;
  }

  while (calcHand(game.dealer) < 17) {
    game.dealer.push(drawCard());
  }

  game.finished = true;
  game.result = judgeGame(game);
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
  if (user.money < game.bet) return { error: "お金が足りません" };

  user.money -= game.bet;
  game.bet *= 2;
  game.doubled = true;

  await writeGuildDB(db);

  game.hands[game.currentHand].push(drawCard());
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
  if (user.money < game.bet) return { error: "お金が足りません" };

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
   勝敗判定
====================== */
function judgeGame(game) {
  const dealer = calcHand(game.dealer);
  let wins = 0;

  for (const hand of game.hands) {
    const total = calcHand(hand);
    if (total > 21) continue;
    if (dealer > 21 || total > dealer) wins++;
  }

  if (wins === game.hands.length) return "win";
  if (wins === 0) return "lose";
  return "push";
}

/* ======================
   払い戻し
====================== */
async function payout(guildId, userId, game) {
  const db = await readGuildDB();
  const user = db[guildId].users[userId];

  const blackjack = isBlackjack(game.hands[0]);

  if (game.result === "win") {
    user.money += blackjack ? game.bet * 3 : game.bet * 2;
  }
  if (game.result === "push") {
    user.money += game.bet;
  }

  await writeGuildDB(db);
}
