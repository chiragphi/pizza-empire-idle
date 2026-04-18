# 🍕 Pizza Empire — Idle Tycoon

> *Build your pizza empire from a humble street stand to a galactic franchise.*

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/chiragphi/pizza-empire-idle)

---

## 🎮 How to Play

1. **Click the pizza** to toss dough and earn coins
2. **Buy upgrades** in the right panel to boost your click value and passive income
3. **Hire staff** to earn coins automatically, even when you're not clicking
4. **Unlock milestones** as your empire grows — each one triggers a celebration!
5. **Come back later** — your staff earns coins while you're away (up to 4 hours)

## 🌍 The World Scene

The 2D canvas scene evolves as you play:
- **Stage 0**: Humble food cart
- **Stage 1**: Small neighborhood restaurant
- **Stage 2**: Full two-story restaurant with outdoor seating
- **Stage 3**: Neon-lit multi-story franchise building

Workers appear visually — delivery bikers zoom across the street, chefs peer from windows, and drones fly overhead once you've scaled up enough.

## 🏆 Milestones

| Milestone | Trigger |
|-----------|---------|
| First Slice Sold! | Earn 100 coins |
| You're Not Alone | Hire your first worker |
| Grand Opening! | Unlock the Second Location upgrade |
| Pizza Empire Goes Viral! | Earn 50,000 coins total |
| First Drone Delivery Launched! | Unlock Drone Delivery |
| PIZZA EMPIRE! | Earn 1,000,000 coins total |

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + custom CSS animations
- **2D World**: HTML5 Canvas (hand-crafted, no external engine)
- **Audio**: Web Audio API (all sounds procedurally generated)
- **State**: React `useReducer` + localStorage persistence
- **Fonts**: Playfair Display + DM Sans (Google Fonts)
- **Deployment**: Vercel

## 🚀 Run Locally

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## 🏗 Build & Deploy

```bash
npm run build   # Type check + production build
npm start       # Start production server
```

Or deploy instantly with Vercel — the `vercel.json` is already configured.

## 📁 Project Structure

```
/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout + fonts
│   ├── page.tsx            # Mounts <Game />
│   └── globals.css         # CSS variables, animations, design system
├── components/
│   ├── Game.tsx            # Root orchestrator: state, loop, save/load
│   ├── WorldCanvas.tsx     # HTML5 Canvas 2D pizza world
│   ├── HUD.tsx             # Top bar: coins, rate, empire rank
│   ├── ClickTarget.tsx     # The big pizza toss button
│   ├── UpgradeShop.tsx     # Scrollable upgrade cards
│   ├── WorkersPanel.tsx    # Hire/view automator workers
│   ├── MilestoneLog.tsx    # Progress tracker
│   ├── Toast.tsx           # Notification popups
│   └── SettingsModal.tsx   # Mute + reset controls
└── lib/
    ├── gameState.ts        # TypeScript state types
    ├── gameLoop.ts         # Tick engine + reducer
    ├── upgrades.ts         # 12 upgrade definitions
    ├── workers.ts          # 7 worker definitions
    ├── milestones.ts       # 6 milestone definitions
    ├── audio.ts            # Web Audio API sound generators
    ├── particles.ts        # Canvas particle system
    ├── canvasScene.ts      # 2D world draw functions
    ├── formatNumber.ts     # Number formatting (K, M, B, T)
    └── storage.ts          # localStorage save/load
```

---

*Made with ❤️ and a lot of imaginary dough.*
