export const chapterDefs = [
  ['invitation', 'The sealed invitation', 'Invitation Key', 'Break the seal', 'Tap the wax seal to open a letter addressed to you.', 'seal'],
  ['gate', 'The garden entrance', 'Garden Gate Key', 'Turn the garden key', 'Turn the leaf-shaped key and step into your birthday garden.', 'turn'],
  ['blessings', 'The blessings courtyard', 'Blessing Key', 'Open the courtyard', 'A gentle turn opens a quiet space for birthday prayers.', 'turn'],
  ['wishes', 'The growing wishes', 'Growing Key', 'Turn the Growing Key', 'Choose the Growing Key, then turn it to open your garden of wishes.', 'turn'],
  ['lantern', 'The lantern walk', 'Lantern Key', 'Light the lantern', 'One little light is enough to begin the next part of the path.', 'lantern'],
  ['memories', 'The memory cabinet', 'Memory Key', 'Turn the Memory Key', 'Choose the Memory Key, then turn it to open the memory cabinet.', 'turn'],
  ['celebration', 'The birthday pavilion', 'Celebration Key', 'Open the birthday gift', 'Untie the ribbon for candles and a birthday wish.', 'ribbon'],
  ['letter', 'The personal letter', 'Letter Key', 'Unfold the envelope', 'A few words from {sender}, with room to read at your own pace.', 'envelope'],
  ['keepsake', 'The final keepsake', 'Keepsake Key', 'Place the final key', 'Set this key in the garden frame to reveal your final wish.', 'assemble'],
];
export const unlockKinds = ['scratch','shake','slide','trace','seal','turn','water','lantern','pattern','ribbon','envelope','assemble'];
export const revealKinds = ['curtains','trace','doors','flower','lamp','page','arch','ribbon','hanging','window','garland','envelope','finalcard'];
export const defaultJourney = {
  enabled: true, autoplay: true, volume: 0.28, intensity: 'gentle', scratchThreshold:.4, shakeSensitivity:14, centralWish:'',
  chapters: chapterDefs.map(([id,title,key,label,instruction,unlock],i) => ({id,title,key,label,instruction,unlock:({invitation:'scratch',lantern:'shake',memories:'turn',letter:'trace'})[id]||unlock,visible:true,trackTitle:'',artist:'',source:'',license:'',provenance:'original',duration:0,trackId:`24102026${String(i+1).padStart(16,'0')}`})),
};
export function normaliseJourney(value) {
  const chapters = value?.chapters || defaultJourney.chapters;
  return {...defaultJourney,...value,chapters: chapters.map(c => ({...defaultJourney.chapters.find(d=>d.id===c.id),...c}))};
}
export function visibleChapters(content) {
  return normaliseJourney(content.journey).chapters.filter(c=>c.visible &&
    !(c.id==='blessings'&&!content.blessings?.enabled) &&
    !(c.id==='memories'&&!content.sections.memories) &&
    !(c.id==='letter'&&!content.sections.letter));
}
export const stepBlessings = [
  ['Peace','{shortName}, I hope the year ahead gives you moments when your mind feels quiet and your heart feels at home.'],
  ['Courage','I hope you take a step towards something that matters to you, even before every uncertainty has disappeared.'],
  ['Good health','I wish you the strength to enjoy your days, the rest to recover from demanding ones, and the time to care for yourself.'],
  ['Wisdom','I hope you recognise what deserves your energy and feel confident choosing the paths that help you grow.'],
  ['Kind friendships','I hope the people around you make kindness feel ordinary and belonging feel easy.'],
  ['Gratitude','May you notice the small kindnesses that make ordinary days feel warmer, and have time to enjoy them.'],
  ['Patience','You do not need every answer today. May you give yourself room to learn, change, and begin again.'],
  ['Hope','When plans change, I hope you still find something worth looking forward to.'],
  ['Joy','I hope your year is filled with laughter that arrives naturally and moments you wish could last a little longer.'],
  ['Purpose','May your efforts bring you closer to something that matters to you, one thoughtful step at a time.'],
  ['Rest','May you find evenings that ask nothing of you except to breathe, rest, and be yourself.'],
  ['New beginnings','May you feel free to start something small, without needing to know exactly where it will lead.'],
  ['A final prayer','May your new year bring health, clarity, steady courage, and the comfort of being cared for. Happy Birthday, {shortName}.'],
];
export function withStepDefaults(p,i) {
  const [theme,blessing] = stepBlessings[i%stepBlessings.length];
  return {theme,blessing,reveal:revealKinds[i%revealKinds.length],...p};
}
export const newLetter = `Dear {shortName},

Some birthdays deserve more than a message sent at midnight and buried beneath tomorrow’s notifications.

For yours, I wanted to make something you could return to: a little garden of thoughts, prayers, and possibilities, with a different wish waiting behind every door.

I hope this new year gives you more than reasons to celebrate. I hope it gives you reasons to feel at ease with yourself.

I hope you find work that makes your efforts feel worthwhile, friendships in which you never have to guess whether you matter, and quiet moments that remind you that life does not have to be extraordinary to be beautiful.

When you are excited about something, I hope you find the courage to begin. When you are uncertain, I hope you give yourself time to understand. And when a day does not go as planned, I hope you remember that a difficult chapter does not decide the whole story.

There will be things this year that you cannot predict yet: a conversation that changes your perspective, a small success that means more than anyone realises, a place that feels unexpectedly familiar, or a perfectly ordinary afternoon that becomes a favourite memory.

I hope you notice those moments when they arrive.

I also hope you keep a little room for the version of yourself you have not met yet—the one who knows something you are still learning, feels brave about something that seems difficult today, and looks back with gratitude that you kept going.

For your birthday, my wish is simple: that your life feels increasingly like your own. That you have space to grow, people to laugh with, strength when you need it, and something good to look forward to.

You do not have to earn every peaceful moment. You do not have to turn every day into an achievement. Sometimes, being here, trying again, and being kind is already something worth celebrating.

So here is a small garden for your new year.

A light for the uncertain evenings.
A little courage for the unfamiliar paths.
A prayer for your health and peace.
And a reminder that someone took the time to wish you well.

Happy Birthday, {shortName}.

May the days ahead bring moments you will be glad to have lived.

With heartfelt wishes,
{sender}`;
export const newFinalWish = 'For the year ahead, I wish you a life with room to breathe, people who make you feel at home, and the courage to begin what matters to you.\n\nMay ordinary days bring unexpected joy. May uncertain days bring someone kind. And may you look back on this year with moments you are glad to have lived.\n\nHappy Birthday, {shortName}. There is still so much good waiting to become part of your story.';

export const centralBirthdayWish = `{shortName}, I hope this birthday becomes the beginning of a year that feels good to live, not just good to describe.

A year with people who make you feel welcome.
Work that gives your effort a sense of purpose.
Rest that arrives without guilt.
And little moments of happiness you do not have to plan.

I hope you find the courage to begin something that matters to you, the patience to grow at your own pace, and the kindness to recognise how far you have already come.

When a day feels uncertain, I hope someone helps you feel less alone. When something wonderful happens, I hope you have people who celebrate it with you.

More than a perfect year, I wish you a meaningful one.

A year that gives you stories worth keeping, friendships worth caring for, and reasons to look forward to tomorrow.

Happy Birthday, {shortName}.

With heartfelt wishes,
{sender}`;
