export interface Question {
  key: string;
  label: string;
  hint: string;
  options?: string[];
  multi?: boolean;
  type?: string;
  optional?: boolean;
}

export const QUESTIONS: Question[] = [
  {
    key: 'vibe',
    label: "What's your ideal vibe?",
    hint: 'Pick everything that feels right',
    options: ['Intimate & low-key', 'Fun & energetic', 'Luxurious & indulgent', 'Wild & unpredictable', 'Adventurous & outdoorsy', 'Cultural & meaningful'],
    multi: true,
  },
  {
    key: 'crowd',
    label: "Who's going to be there?",
    hint: 'Helps us plan the right atmosphere',
    options: ['Close friends only', 'Mix of friends & family', 'Mostly family', 'Partner + a few friends', 'Large group (20+)', 'Just the two of us'],
    multi: true,
  },
  {
    key: 'musthaves',
    label: 'Non-negotiable must-haves?',
    hint: 'Pick everything that applies',
    options: ['Great food', 'Good music', 'Dancing', 'Adventure / activity', 'Beautiful setting', 'Good wine / cocktails', 'Privacy', 'Surprises'],
    multi: true,
  },
  {
    key: 'surprises',
    label: 'How do you feel about surprises?',
    hint: 'Be honest — we want to get this right',
    options: ['I love them — the more the better', 'A few small surprises are nice', 'I prefer to know the plan', 'Please no surprises at all'],
    multi: false,
  },
  {
    key: 'duration',
    label: 'Ideal celebration length?',
    hint: 'Think about what would feel just right',
    options: ['A few hours (dinner, drinks)', 'A full day out', 'A whole weekend away', 'Multiple days / a trip'],
    multi: false,
  },
  {
    key: 'dealbreakers',
    label: 'What should we avoid?',
    hint: 'Pick all that apply',
    options: ['Too many people', 'Anything too planned/rigid', 'Anything cheesy or generic', 'Being the centre of attention', 'Spending too much', 'Outdoors in bad weather', 'Loud venues / clubs'],
    multi: true,
  },
  {
    key: 'dietary',
    label: 'Any dietary or access needs?',
    hint: 'So we can plan venues and food properly',
    options: ['Vegetarian', 'Vegan', 'Gluten-free', 'Halal', 'Kosher', 'No alcohol', 'Wheelchair access needed', 'None'],
    multi: true,
    optional: true,
  },
  {
    key: 'budget',
    label: 'Your budget comfort zone per person?',
    hint: 'Rough guide — no commitment',
    options: ['Under £100', '£100–£300', '£300–£600', '£600–£1,200', 'No limit'],
    multi: false,
  },
  {
    key: 'note',
    label: 'Anything else the planner should know?',
    hint: 'Dreams, ideas, things that matter to you',
    type: 'text',
    optional: true,
  },
];
