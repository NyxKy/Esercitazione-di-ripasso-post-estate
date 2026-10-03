export interface Emoji {
  id: string;
  name: string;
  emoji: string;
  group: string;
}

export type CategoryId = string;

export interface EmojiCategory {
  id: CategoryId;
  name: string;
  emoji: string;
  description: string;
  /** Colori (facoltativi): se mancano si generano dall'id. */
  tint?: CategoryTint;
  /** Path SVG dell'icona nella dock (viewBox 0 0 24 24), facoltativo. */
  icon?: string;
  /** true = compare anche in modalita Classico. */
  classic?: boolean;
  items: Emoji[];
}

export const CATEGORIES: EmojiCategory[] = [
  {
    id: 'animals', name: 'Animali', emoji: '🐾',
    description: 'Compagni di pianeta, grandi e piccoli.',
    classic: true,
    items: [
      { id: 'dog', name: 'Cane', emoji: '🐶', group: 'Mammiferi' },
      { id: 'cat', name: 'Gatto', emoji: '🐱', group: 'Mammiferi' },
      { id: 'fox', name: 'Volpe', emoji: '🦊', group: 'Mammiferi' },
      { id: 'bear', name: 'Orso', emoji: '🐻', group: 'Mammiferi' },
      { id: 'panda', name: 'Panda', emoji: '🐼', group: 'Mammiferi' },
      { id: 'lion', name: 'Leone', emoji: '🦁', group: 'Mammiferi' },
      { id: 'frog', name: 'Rana', emoji: '🐸', group: 'Altri' },
      { id: 'penguin', name: 'Pinguino', emoji: '🐧', group: 'Uccelli' },
      { id: 'butterfly', name: 'Farfalla', emoji: '🦋', group: 'Altri' },
      { id: 'whale', name: 'Balena', emoji: '🐳', group: 'Marini' },
      { id: 'octopus', name: 'Polpo', emoji: '🐙', group: 'Marini' },
      { id: 'turtle', name: 'Tartaruga', emoji: '🐢', group: 'Altri' },
    ],
  },
  {
    id: 'fruits', name: 'Frutta', emoji: '🍋',
    description: 'Una dose di colore, appena raccolta.',
    classic: true,
    items: [
      { id: 'lemon', name: 'Limone', emoji: '🍋', group: 'Agrumi' },
      { id: 'orange', name: 'Arancia', emoji: '🍊', group: 'Agrumi' },
      { id: 'apple', name: 'Mela', emoji: '🍎', group: 'Dal frutteto' },
      { id: 'pear', name: 'Pera', emoji: '🍐', group: 'Dal frutteto' },
      { id: 'peach', name: 'Pesca', emoji: '🍑', group: 'Dal frutteto' },
      { id: 'cherries', name: 'Ciliegie', emoji: '🍒', group: 'Dal frutteto' },
      { id: 'strawberry', name: 'Fragola', emoji: '🍓', group: 'Piccoli frutti' },
      { id: 'blueberries', name: 'Mirtilli', emoji: '🫐', group: 'Piccoli frutti' },
      { id: 'banana', name: 'Banana', emoji: '🍌', group: 'Tropicale' },
      { id: 'pineapple', name: 'Ananas', emoji: '🍍', group: 'Tropicale' },
      { id: 'kiwi', name: 'Kiwi', emoji: '🥝', group: 'Tropicale' },
      { id: 'watermelon', name: 'Anguria', emoji: '🍉', group: 'Dal campo' },
    ],
  },
  {
    id: 'food', name: 'Cibo', emoji: '🍕',
    description: 'Il menu delle tue prossime conversazioni.',
    items: [
      { id: 'pizza', name: 'Pizza', emoji: '🍕', group: 'Salato' },
      { id: 'burger', name: 'Hamburger', emoji: '🍔', group: 'Salato' },
      { id: 'fries', name: 'Patatine', emoji: '🍟', group: 'Salato' },
      { id: 'taco', name: 'Taco', emoji: '🌮', group: 'Salato' },
      { id: 'sushi', name: 'Sushi', emoji: '🍣', group: 'Salato' },
      { id: 'pasta', name: 'Spaghetti', emoji: '🍝', group: 'Salato' },
      { id: 'croissant', name: 'Croissant', emoji: '🥐', group: 'Dolce' },
      { id: 'donut', name: 'Ciambella', emoji: '🍩', group: 'Dolce' },
      { id: 'icecream', name: 'Gelato', emoji: '🍦', group: 'Dolce' },
      { id: 'cake', name: 'Torta', emoji: '🍰', group: 'Dolce' },
      { id: 'coffee', name: 'Caffè', emoji: '☕', group: 'Bevande' },
      { id: 'juice', name: 'Succo', emoji: '🧃', group: 'Bevande' },
    ],
  },
  {
    id: 'vehicles', name: 'Veicoli', emoji: '🚀',
    description: 'La prossima destinazione? Sceglila tu.',
    items: [
      { id: 'car', name: 'Automobile', emoji: '🚗', group: 'Su strada' },
      { id: 'taxi', name: 'Taxi', emoji: '🚕', group: 'Su strada' },
      { id: 'bus', name: 'Autobus', emoji: '🚌', group: 'Su strada' },
      { id: 'bike', name: 'Bicicletta', emoji: '🚲', group: 'Su strada' },
      { id: 'scooter', name: 'Scooter', emoji: '🛵', group: 'Su strada' },
      { id: 'ambulance', name: 'Ambulanza', emoji: '🚑', group: 'Su strada' },
      { id: 'train', name: 'Treno', emoji: '🚆', group: 'Su rotaia' },
      { id: 'tram', name: 'Tram', emoji: '🚋', group: 'Su rotaia' },
      { id: 'plane', name: 'Aereo', emoji: '✈️', group: 'In volo' },
      { id: 'helicopter', name: 'Elicottero', emoji: '🚁', group: 'In volo' },
      { id: 'rocket', name: 'Razzo', emoji: '🚀', group: 'In volo' },
      { id: 'sailboat', name: 'Barca a vela', emoji: '⛵', group: 'In acqua' },
    ],
  },
];

/** Tinta di una categoria: quella dichiarata, o una pastello derivata dall'id.
    Cosi una categoria nuova ha subito i suoi colori senza toccare il CSS. */
export function tintFor(category: EmojiCategory): CategoryTint {
  if (category.tint) return category.tint;
  let hue = 0;
  for (const ch of category.id) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
  return { fill: `hsl(${hue} 62% 91%)`, line: `hsl(${hue} 52% 79%)`, ink: `hsl(${hue} 58% 31%)` };
}

export interface CategoryTint { fill: string; line: string; ink: string; }
