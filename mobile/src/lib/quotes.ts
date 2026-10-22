export type Quote = { text: string; author: string; source?: string }

// A small curated set to start; the spec aims for ~100.
export const QUOTES: Quote[] = [
  { text: 'You have power over your mind, not outside events. Realize this, and you will find strength.', author: 'Marcus Aurelius', source: 'Meditations' },
  { text: 'Waste no more time arguing what a good man should be. Be one.', author: 'Marcus Aurelius', source: 'Meditations' },
  { text: 'The impediment to action advances action. What stands in the way becomes the way.', author: 'Marcus Aurelius', source: 'Meditations' },
  { text: 'Look back over the past, with its changing empires, and you can foresee the future too.', author: 'Marcus Aurelius', source: 'Meditations' },
  { text: 'Very little is needed to make a happy life; it is all within yourself, in your way of thinking.', author: 'Marcus Aurelius', source: 'Meditations' },
  { text: 'Confine yourself to the present.', author: 'Marcus Aurelius', source: 'Meditations' },
  { text: 'If it is not right, do not do it; if it is not true, do not say it.', author: 'Marcus Aurelius', source: 'Meditations' },
  { text: 'We suffer more often in imagination than in reality.', author: 'Seneca', source: 'Letters' },
  { text: 'Luck is what happens when preparation meets opportunity.', author: 'Seneca' },
  { text: 'While we wait for life, life passes.', author: 'Seneca', source: 'Letters' },
  { text: 'It is not that we have a short time to live, but that we waste a lot of it.', author: 'Seneca', source: 'On the Shortness of Life' },
  { text: 'Begin at once to live, and count each separate day as a separate life.', author: 'Seneca', source: 'Letters' },
  { text: 'No man is free who is not master of himself.', author: 'Epictetus' },
  { text: 'First say to yourself what you would be; and then do what you have to do.', author: 'Epictetus', source: 'Discourses' },
  { text: 'It is impossible for a man to learn what he thinks he already knows.', author: 'Epictetus', source: 'Discourses' },
  { text: 'Make the best use of what is in your power, and take the rest as it happens.', author: 'Epictetus', source: 'Enchiridion' },
  { text: 'Difficulties are things that show a person what they are.', author: 'Epictetus', source: 'Discourses' },
  { text: 'Wealth consists not in having great possessions, but in having few wants.', author: 'Epictetus' },
]

// The same quote all day, a different one tomorrow.
export const quoteOfDay = (day: string, offset = 0): Quote => {
  const n = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86_400_000) + offset
  return QUOTES[((n % QUOTES.length) + QUOTES.length) % QUOTES.length]!
}

export const todayKey = () => new Date().toISOString().slice(0, 10)
