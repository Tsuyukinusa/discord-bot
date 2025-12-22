// utils/blackjackCore.js
import { readGuildDB, writeGuildDB } from "../utils/file.js";
import { getGame, saveGame, endGame } from "./blackjackStore.js";
import { drawCard, calcHand, judgeHand } from "./blackjackLogic.js";

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

  const hand = game.hands[game.currentHand];
  hand.push(drawCard());

  if (calcHand(hand) > 21) {
    // 次の hand があれば切り替え
    if (game.split && game.currentHand === 0) {
      game.currentHand = 1;
    } else {
      await finishGame(guildId, userId, game);
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

  await finishGame(guildId, userId, game);
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
  if (hand.length !== 2 || hand[0].rank !== hand[1].rank) {
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
   終了処理
====================== */
async function finishGame(guildId, userId, game) {
  while (calcHand(game.dealer) < 17) {
    game.dealer.push(drawCard());
  }

  game.results = game.hands.map(hand =>
    judgeHand(hand, game.dealer)
  );

  await payout(guildId, userId, game);

  game.finished = true;
  endGame(guildId, userId);
}

/* ======================
   払い戻し
====================== */
async function payout(guildId, userId, game) {
  const db = await readGuildDB();
  const user = db[guildId].users[userId];

  for (const result of game.results) {
    if (result === "win") user.money += game.bet * 2;
    if (result === "push") user.money += game.bet;
  }

  await writeGuildDB(db);
}
