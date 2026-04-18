export interface Worker {
  id: string;
  name: string;
  icon: string;
  description: string;
  flavorText: string;
  baseCost: number;
  baseCps: number;
  costMultiplier: number; // cost grows by this factor per purchase
  requiredCoins?: number;
}

export const WORKERS: Worker[] = [
  {
    id: "pizza_boy",
    name: "Pizza Boy",
    icon: "🛵",
    description: "Enthusiastic teen on a scooter. Gets lost sometimes, but always arrives eventually.",
    flavorText: "He knows every shortcut in town. Most of them are legal.",
    baseCost: 100,
    baseCps: 0.1,
    costMultiplier: 1.15,
    requiredCoins: 0,
  },
  {
    id: "line_cook",
    name: "Line Cook",
    icon: "👨‍🍳",
    description: "Trained at culinary school. Doesn't talk about their thesis.",
    flavorText: "Thirty pizzas per hour and not a single complaint. Respect.",
    baseCost: 500,
    baseCps: 0.5,
    costMultiplier: 1.15,
    requiredCoins: 200,
  },
  {
    id: "head_chef",
    name: "Head Chef",
    icon: "👩‍🍳",
    description: "Michelin-trained mastermind. Intimidates the line cooks on purpose.",
    flavorText: "She once made a pizza so perfect, a food critic wept.",
    baseCost: 2000,
    baseCps: 2,
    costMultiplier: 1.15,
    requiredCoins: 1000,
  },
  {
    id: "kitchen_manager",
    name: "Kitchen Manager",
    icon: "📋",
    description: "Keeps the chaos organized. Has seventeen clipboards for some reason.",
    flavorText: "If there's a process problem, Marco has already made a form about it.",
    baseCost: 8000,
    baseCps: 8,
    costMultiplier: 1.15,
    requiredCoins: 4000,
  },
  {
    id: "restaurant_manager",
    name: "Restaurant Manager",
    icon: "💼",
    description: "Manages front-of-house with terrifying efficiency. Never forgets a reservation.",
    flavorText: "She runs two locations simultaneously and still remembers your birthday.",
    baseCost: 50000,
    baseCps: 25,
    costMultiplier: 1.15,
    requiredCoins: 20000,
  },
  {
    id: "regional_director",
    name: "Regional Director",
    icon: "🏢",
    description: "Oversees 12 locations across four states. Lives on spreadsheets and espresso.",
    flavorText: "\"Q3 numbers are up 40%.\" He texted this on his honeymoon.",
    baseCost: 300000,
    baseCps: 100,
    costMultiplier: 1.15,
    requiredCoins: 100000,
  },
  {
    id: "corporate_exec",
    name: "Corporate Executive",
    icon: "🎩",
    description: "C-Suite visionary. Speaks entirely in synergistic pizza metaphors.",
    flavorText: "\"Think of our company as one pizza. We are all the cheese.\"",
    baseCost: 2000000,
    baseCps: 400,
    costMultiplier: 1.15,
    requiredCoins: 800000,
  },
];

export function getWorkerById(id: string): Worker | undefined {
  return WORKERS.find((w) => w.id === id);
}

export function getWorkerCost(worker: Worker, owned: number): number {
  return Math.floor(worker.baseCost * Math.pow(worker.costMultiplier, owned));
}
