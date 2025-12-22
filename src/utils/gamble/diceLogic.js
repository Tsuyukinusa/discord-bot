// utils/gamble/diceLogic.js

export function rollDice(count) {
  return Array.from({ length: count }, () =>
    Math.floor(Math.random() * 6) + 1
  );
}

export function judgeDice({ dice, betType }) {
  const sum = dice.reduce((a, b) => a + b, 0);

  switch (betType) {
    case "odd":
      return sum % 2 === 1;

    case "even":
      return sum % 2 === 0;

    case "high":
      return sum >= getHighLowBorder(dice.length);

    case "low":
      return sum < getHighLowBorder(dice.length);

    case "pair":
      return dice.length === 2 && dice[0] === dice[1];

    case "triple":
      return dice.length === 3 && dice.every(d => d === dice[0]);

    case "straight":
      if (dice.length !== 3) return false;
      const s = [...dice].sort((a, b) => a - b);
      return s[1] === s[0] + 1 && s[2] === s[1] + 1;

    default:
      return false;
  }
}

function getHighLowBorder(count) {
  if (count === 1) return 4;   // 1-3 / 4-6
  if (count === 2) return 7;   // 2-6 / 7-12
  if (count === 3) return 11;  // 3-10 / 11-18
}

export function getDicePayout(type) {
  return {
    odd: 1.9,
    even: 1.9,
    high: 2,
    low: 2,
    pair: 5,
    triple: 30,
    straight: 12
  }[type] ?? 0;
}
