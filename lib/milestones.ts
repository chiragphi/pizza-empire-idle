import { GameState } from "./gameState";

export interface Milestone {
  id: string;
  name: string;
  description: string;
  celebrationText: string;
  audioType: "fanfare" | "chime" | "trumpet";
  check: (state: GameState) => boolean;
}

export const MILESTONES: Milestone[] = [
  {
    id: "first_hundred",
    name: "First Slice Sold",
    description: "Earn your first 100 coins",
    celebrationText: "Your first 100 coins. The empire starts with a single slice.",
    audioType: "chime",
    check: (s) => s.totalCoinsEarned >= 100,
  },
  {
    id: "hired_help",
    name: "First Hire",
    description: "Hire your first worker",
    celebrationText: "Your first hire. Welcome to being a boss.",
    audioType: "chime",
    check: (s) => Object.values(s.workers).some((w) => w.count > 0),
  },
  {
    id: "second_location",
    name: "Grand Opening",
    description: "Open your second location",
    celebrationText: "Second location open. Cut the ribbon. This is real now.",
    audioType: "fanfare",
    check: (s) => s.upgrades["second_location"]?.owned === true,
  },
  {
    id: "going_viral",
    name: "Pizza Empire Goes Viral",
    description: "Earn 50,000 coins total",
    celebrationText: "50,000 coins. The internet has discovered your pizza. No going back.",
    audioType: "fanfare",
    check: (s) => s.totalCoinsEarned >= 50000,
  },
  {
    id: "drone_launch",
    name: "Drone Fleet Deployed",
    description: "Deploy your drone delivery fleet",
    celebrationText: "Drone delivery is live. The skies belong to Pizza Empire now.",
    audioType: "trumpet",
    check: (s) => s.upgrades["drone_delivery"]?.owned === true,
  },
  {
    id: "pizza_empire",
    name: "Pizza Empire",
    description: "Reach 1,000,000 coins total earned",
    celebrationText: "One million coins. You are the undisputed Pizza Emperor.",
    audioType: "trumpet",
    check: (s) => s.totalCoinsEarned >= 1000000,
  },
];

export function getMilestoneById(id: string): Milestone | undefined {
  return MILESTONES.find((m) => m.id === id);
}

export function checkNewMilestones(state: GameState): Milestone[] {
  return MILESTONES.filter(
    (m) => !state.milestones[m.id]?.unlocked && m.check(state)
  );
}

export const EMPIRE_RANKS: { threshold: number; title: string }[] = [
  { threshold: 0,        title: "Dough Novice"       },
  { threshold: 500,      title: "Sauce Apprentice"   },
  { threshold: 5000,     title: "Cheese Artisan"     },
  { threshold: 25000,    title: "Pizza Chef"          },
  { threshold: 100000,   title: "Restaurant Owner"   },
  { threshold: 500000,   title: "Franchise Mogul"    },
  { threshold: 2000000,  title: "Pizza Tycoon"       },
  { threshold: 10000000, title: "Pizza Emperor"      },
  { threshold: 50000000, title: "Galactic Pizzamaster"},
];

export function getEmpireRank(totalCoinsEarned: number): { title: string } {
  let rank = EMPIRE_RANKS[0];
  for (const r of EMPIRE_RANKS) {
    if (totalCoinsEarned >= r.threshold) rank = r;
  }
  return { title: rank.title };
}
