const SUITS = ["♠", "♥", "♦", "♣"];
const VALUES = [1,2,3,4,5,6,7,8,9,10,11,12,13];

export function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({
        suit,
        value,
        display:
          (value === 1 ? "A" :
           value === 11 ? "J" :
           value === 12 ? "Q" :
           value === 13 ? "K" : value) + suit
      });
    }
  }
  return deck;
}

export function shuffle(deck) {
  return deck.sort(() => Math.random() - 0.5);
}

export function dealHand() {
  return shuffle(createDeck()).slice(0, 5);
}
