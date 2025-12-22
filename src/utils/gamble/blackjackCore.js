// utils/gamble/blackjackCore.js
import { getUser, saveUser } from "../userDB.js";

// カード生成
function drawCard() {
  const cards = [2,3,4,5,6,7,8,9,10,10,10,10,11]; // JQK=10, A=11
  return cards[Math.floor(Math.random() * cards.length)];
}

// 手札合計（Aを1 or 11で調整）
function calcHand(hand) {
  let total = hand.reduce((a, b) => a + b, 0);
  let aces = hand.filter(c => c === 11).length;

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

// ゲーム開始
export function startBlackjack({ guildId, userId, bet }) {
  const user = getUser(guildId, userId);
  if (user.money < bet) return { error: "お金が足りません。" };

  user.money -= bet;

  const playerHand = [drawCard(), drawCard()];
  const dealerHand = [drawCard(), drawCard()];

  saveUser(guildId, userId, user);

  return {
    bet,
    playerHand,
    dealerHand,
    state: "playing"
  };
}

// ヒット
export function hit(game) {
  game.playerHand.push(drawCard());
  const total = calcHand(game.playerHand);

  if (total > 21) {
    game.state = "bust";
  }
  return game;
}

// スタンド（ディーラー処理）
export function stand(game) {
  let dealerTotal = calcHand(game.dealerHand);

  // ディーラーは17以上で止まる
  while (dealerTotal < 17) {
    game.dealerHand.push(drawCard());
    dealerTotal = calcHand(game.dealerHand);
  }

  const playerTotal = calcHand(game.playerHand);

  if (dealerTotal > 21 || playerTotal > dealerTotal) {
    game.result = "win";
  } else if (playerTotal < dealerTotal) {
    game.result = "lose";
  } else {
    game.result = "draw";
  }

  game.state = "end";
  return game;
}

// 決済
export function settleBlackjack({ guildId, userId, game }) {
  const user = getUser(guildId, userId);

  if (game.result === "win") user.money += game.bet * 2;
  if (game.result === "draw") user.money += game.bet;

  saveUser(guildId, userId, user);
  return user.money;
}

export { calcHand };
