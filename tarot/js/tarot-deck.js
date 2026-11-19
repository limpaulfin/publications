const MAJOR_ARCANA = [
    "Major - 0 The Fool", "Major - 1 The Magician", "Major - 2 The High Priestess",
    "Major - 3 The Empress", "Major - 4 The Emperor", "Major - 5 The Hierophant",
    "Major - 6 The Lovers", "Major - 7 The Chariot", "Major - 8 Strength",
    "Major - 9 The Hermit", "Major - 10 Wheel of Fortune", "Major - 11 Justice",
    "Major - 12 The Hanged Man", "Major - 13 Death", "Major - 14 Temperance",
    "Major - 15 The Devil", "Major - 16 The Tower", "Major - 17 The Star",
    "Major - 18 The Moon", "Major - 19 The Sun", "Major - 20 Judgement",
    "Major - 21 The World"
];

const SUITS = ["Wands", "Cups", "Swords", "Pentacles"];
const NUMBER_NAMES = [
    "", "Ace", "Two", "Three", "Four", "Five",
    "Six", "Seven", "Eight", "Nine", "Ten"
];
const COURT = ["Page", "Knight", "Queen", "King"];

function buildDeck() {
    const deck = [...MAJOR_ARCANA];
    for (const suit of SUITS) {
        for (let i = 1; i <= 10; i++) {
            deck.push(`${suit} - ${i} ${NUMBER_NAMES[i]} of ${suit}`);
        }
        for (const court of COURT) {
            deck.push(`${suit} - ${court} of ${suit}`);
        }
    }
    return deck;
}

const FULL_DECK = buildDeck();
