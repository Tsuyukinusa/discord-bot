// utils/gamble/blackjackCore.js

// ===== カード定義 =====
const SUITS = ["♠", "♥", "♦", "♣"];
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

// ===== 山札生成 =====
function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value });
    }
  }
  return shuffle(deck);
}

// ===== シャッフル =====
function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// ===== カード1枚引く =====
function draw(deck) {
  return deck.pop();
}

// ===== カードの点数 =====
function cardValue(card) {
  if (card.value === "A") return 11;
  if (["J", "Q", "K"].includes(card.value)) return 10;
  return Number(card.value);
}

// ===== 手札の合計点（Aを1 or 11で調整） =====
function calculateScore(hand) {
  let score = 0;
  let aces = 0;

  for (const card of hand) {
    score += cardValue(card);
    if (card.value === "A") aces++;
  }

  // バースト回避
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }

  return score;
}

// ===== スプリット可能か =====
function canSplit(hand) {
  return (
    hand.length === 2 &&
    cardValue(hand[0]) === cardValue(hand[1])
  );
}

// ===== ブラックジャック初期化 =====
export function createBlackjackGame(bet) {
  const deck = createDeck();

  const playerHand = [draw(deck), draw(deck)];
  const dealerHand = [draw(deck), draw(deck)];

  return {
    deck,
    bet,

    playerHands: [
      {
        hand: playerHand,
        bet,
        isFinished: false,
        isDoubled: false,
      }
    ],

    dealerHand,
    currentHandIndex: 0,
    status: "playing", // playing | finished
  };
}

// ===== ヒット =====
export function hit(game) {
  const handData = game.playerHands[game.currentHandIndex];
  if (handData.isFinished) return;

  handData.hand.push(draw(game.deck));

  if (calculateScore(handData.hand) > 21) {
    handData.isFinished = true;
    nextHand(game);
  }
}

// ===== スタンド =====
export function stand(game) {
  const handData = game.playerHands[game.currentHandIndex];
  handData.isFinished = true;
  nextHand(game);
}

// ===== ダブルダウン =====
export function doubleDown(game) {
  const handData = game.playerHands[game.currentHandIndex];

  if (handData.hand.length !== 2) return false;

  handData.bet *= 2;
  handData.isDoubled = true;
  handData.hand.push(draw(game.deck));
  handData.isFinished = true;

  nextHand(game);
  return true;
}

// ===== スプリット =====
export function split(game) {
  const handData = game.playerHands[game.currentHandIndex];
  if (!canSplit(handData.hand)) return false;

  const [card1, card2] = handData.hand;

  game.playerHands = [
    {
      hand: [card1, draw(game.deck)],
      bet: handData.bet,
      isFinished: false,
      isDoubled: false,
    },
    {
      hand: [card2, draw(game.deck)],
      bet: handData.bet,
      isFinished: false,
      isDoubled: false,
    }
  ];

  game.currentHandIndex = 0;
  return true;
}

// ===== 次の手札へ =====
function nextHand(game) {
  if (game.currentHandIndex < game.playerHands.length - 1) {
    game.currentHandIndex++;
  } else {
    dealerTurn(game);
  }
}

// ===== ディーラーターン =====
function dealerTurn(game) {
  while (calculateScore(game.dealerHand) < 17) {
    game.dealerHand.push(draw(game.deck));
  }
  game.status = "finished";
}

// ===== 勝敗判定 =====
export function judge(game) {
  const dealerScore = calculateScore(game.dealerHand);

  return game.playerHands.map(handData => {
    const playerScore = calculateScore(handData.hand);

    if (playerScore > 21) return "lose";
    if (dealerScore > 21) return "win";
    if (playerScore > dealerScore) return "win";
    if (playerScore < dealerScore) return "lose";
    return "draw";
  });
}

// ===== 表示用 =====
export function formatHand(hand) {
  return hand.map(c => `${c.suit}${c.value}`).join(" ");
}

export function getScores(game) {
  return {
    dealer: calculateScore(game.dealerHand),
    players: game.playerHands.map(h => calculateScore(h.hand)),
  };
}
