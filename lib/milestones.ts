import { GameState } from "./gameState";

export interface Milestone {
  id: string;
  name: string;
  icon: string;
  description: string;
  celebrationText: string;
  audioType: "fanfare" | "chime" | "trumpet";
  check: (state: GameState) => boolean;
}

export const MILESTONES: Milestone[] = [
  {
    id: "first_hundred",
    name: "First Slice Sold!",
    icon: "🍕",
    description: "Earn your first 100 coins",
    celebrationText: "Your first 100 coins! The empire starts with a single slice.",
    audioType: "chime",
    check: (s) => s.totalCoinsEarned >= 100,
  },
  {
    id: "hired_help",
    name: "You're Not Alone",
    icon: "🤝",
    description: "Hire your first worker",
    celebrationText: "Your first hire! Welcome to being a boss. Try not to panic.",
    audioType: "chime",
    check: (s) => Object.values(s.workers).some((w) => w.count > 0),
  },
  {
    id: "second_location",
    name: "Grand Opening!",
    icon: "🏪",
    description: "Open your second location",
    celebrationText: "You opened your 2nd location! Cut the ribbon. Pop the champagne.",
    audioType: "fanfare",
    check: (s) => s.upgrades["second_location"]?.owned === true,
  },
  {
    id: "going_viral",
    name: "Pizza Empire Goes Viral!",
    icon: "📱",
    description: "Earn 50,000 coins total",
    celebrationText: "50,000 coins! The internet has discovered your pizza. There's no going back.",
    audioType: "fanfare",
    check: (s) => s.totalCoinsEarned >= 50000,
  },
  {
    id: "drone_launch",
    name: "First Drone Delivery Launched!",
    icon: "🚁",
    description: "Deploy your drone delivery fleet",
    celebrationText: "Drone delivery is live! The skies belong to Pizza Empire now.",
    audioType: "trumpet",
    check: (s) => s.upgrades["drone_delivery"]?.owned === true,
  },
  {
    id: "pizza_empire",
    name: "PIZZA EMPIRE!",
    icon: "👑",
    description: "Reach 1,000,000 coins total earned",
    celebrationText: "ONE MILLION COINS! You are the undisputed Pizza Emperor of the known universe!",
    audioType: "trumpet",
    check: (s) => s.totalCoinsEarned >= 1000000,
  },
];

export function getMilestoneById(id: string): Milestone | undefined {
  return MILESTONES.find((m) => m.id === id);
}

export function checkNewMilestones(
  state: GameState
): Milestone[] {
  return MILESTONES.filter(
    (m) => !state.milestones[m.id]?.unlocked && m.check(state)
  );
}

export const EMPIRE_RANKS: { threshold: number; title: string; emoji: string }[] = [
  { threshold: 0, title: "Dough Novice", emoji: "🤌" },
  { threshold: 500, title: "Sauce Apprentice", emoji: "🍅" },
  { threshold: 5000, title: "Cheese Artisan", emoji: "🧀" },
  { threshold: 25000, title: "Pizza Chef", emoji: "👨‍🍳" },
  { threshold: 100000, title: "Restaurant Owner", emoji: "🏪" },
  { threshold: 500000, title: "Franchise Mogul", emoji: "📜" },
  { threshold: 2000000, title: "Pizza Tycoon", emoji: "💰" },
  { threshold: 10000000, title: "Pizza Emperor", emoji: "👑" },
  { threshold: 50000000, title: "Galactic Pizzamaster", emoji: "🚀" },
];

export function getEmpireRank(totalCoinsEarned: number): { title: string; emoji: string } {
  let rank = EMPIRE_RANKS[0];
  for (const r of EMPIRE_RANKS) {
    if (totalCoinsEarned >= r.threshold) {
      rank = r;
    }
  }
  return { title: rank.title, emoji: rank.emoji };
}
