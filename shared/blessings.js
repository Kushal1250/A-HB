// Shape shared by the local server and editor. Legacy content stays valid.
export const emptyBlessings = {
  enabled: false,
  title: 'A Garden of Divine Blessings',
  intro: 'Before the candles glow and the wishes bloom, here is a quiet moment of gratitude and prayer for you, {shortName}. May your new year begin with peace in your heart, kindness around you, and the courage to welcome all the beautiful possibilities ahead.',
  prayer: 'Dear {shortName}, on your birthday, I pray that your heart finds peace in uncertain moments, your efforts find meaningful direction, and your life stays surrounded by people who care for you. May you have the courage to follow your dreams, the wisdom to recognise what matters, and countless little reasons to smile. May this new year bring good health, gentle happiness, and beautiful possibilities.',
  closing: 'With heartfelt birthday wishes, {sender}. May there always be something beautiful still to bloom.',
  featuredId: null,
  photos: [],
  videoId: null,
  videoTitle: 'A Quiet Devotional Moment',
  videoDescription: 'A short view of a flower-decorated devotional shrine. Sound is optional.',
  interactions: { lamp: true, flowers: true, wishes: true, gratitude: true },
};
export const blessingWishes = [
  ['Peace', 'May you find moments of calm, space to breathe, and comfort in the people and places you love.'],
  ['Courage', 'May you trust your abilities, take the next step with confidence, and remember how much possibility lies ahead.'],
  ['Joy', 'May ordinary days bring unexpected smiles, warm conversations, and little moments you will treasure.'],
  ['Good Health', 'May the year ahead bring strength, rest, and the time to care for yourself.'],
  ['Wisdom', 'May you recognise the paths that help you grow and choose what brings meaning to your life.'],
  ['Kindness', 'May the care you share with others return to you through thoughtful friendships and gentle moments.'],
];
export function normaliseBlessings(value) {
  return { ...emptyBlessings, ...value, interactions: { ...emptyBlessings.interactions, ...value?.interactions }, photos: value?.photos || [] };
}
