// All custom SVG icons — zero emojis

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

const def = (size: number, color: string, sw: number, props: IconProps) => ({
  width: props.size ?? size,
  height: props.size ?? size,
  stroke: props.color ?? color,
  strokeWidth: props.strokeWidth ?? sw,
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: `0 0 ${size} ${size}`,
  className: props.className,
});

// ─── PIZZA (click target) ────────────────────────────────
export function PizzaIcon(p: IconProps) {
  return (
    <svg {...def(64, "currentColor", 2, p)}>
      {/* Outer crust circle */}
      <circle cx="32" cy="32" r="28" strokeWidth={p.strokeWidth ?? 2.5} />
      {/* Slice lines */}
      <line x1="32" y1="4" x2="32" y2="60" />
      <line x1="7.7" y1="18" x2="56.3" y2="46" />
      <line x1="7.7" y1="46" x2="56.3" y2="18" />
      {/* Toppings (pepperoni circles) */}
      <circle cx="32" cy="22" r="3.5" fill={p.color ?? "currentColor"} stroke="none" />
      <circle cx="22" cy="38" r="3" fill={p.color ?? "currentColor"} stroke="none" />
      <circle cx="42" cy="38" r="3" fill={p.color ?? "currentColor"} stroke="none" />
      <circle cx="32" cy="42" r="2.5" fill={p.color ?? "currentColor"} stroke="none" />
      <circle cx="20" cy="26" r="2" fill={p.color ?? "currentColor"} stroke="none" />
      <circle cx="44" cy="26" r="2" fill={p.color ?? "currentColor"} stroke="none" />
    </svg>
  );
}

// ─── COIN ────────────────────────────────────────────────
export function CoinIcon(p: IconProps) {
  return (
    <svg {...def(24, "currentColor", 1.5, p)}>
      <circle cx="12" cy="12" r="9" />
      <text x="12" y="16.5" textAnchor="middle" fontSize="10" fontWeight="700"
        fill={p.color ?? "currentColor"} stroke="none" fontFamily="serif">$</text>
    </svg>
  );
}

// ─── GEAR (settings) ─────────────────────────────────────
export function GearIcon(p: IconProps) {
  return (
    <svg {...def(24, "currentColor", 1.5, p)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4" />
      <path d="M12 7a5 5 0 1 0 5 5" />
    </svg>
  );
}

// ─── TROPHY ──────────────────────────────────────────────
export function TrophyIcon(p: IconProps) {
  return (
    <svg {...def(24, "currentColor", 1.5, p)}>
      <path d="M6 2h12v10a6 6 0 0 1-12 0V2Z" />
      <path d="M6 7H2a2 2 0 0 0 2 4M18 7h4a2 2 0 0 1-2 4" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

// ─── LOCK ────────────────────────────────────────────────
export function LockIcon(p: IconProps) {
  return (
    <svg {...def(24, "currentColor", 1.5, p)}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      <circle cx="12" cy="16" r="1.5" fill={p.color ?? "currentColor"} stroke="none" />
    </svg>
  );
}

// ─── CHECK ───────────────────────────────────────────────
export function CheckIcon(p: IconProps) {
  return (
    <svg {...def(24, "currentColor", 2, p)}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ─── PLUS ────────────────────────────────────────────────
export function PlusIcon(p: IconProps) {
  return (
    <svg {...def(24, "currentColor", 2, p)}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ─── ARROW UP ────────────────────────────────────────────
export function ArrowUpIcon(p: IconProps) {
  return (
    <svg {...def(24, "currentColor", 2, p)}>
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

// ─── CLOSE (X) ───────────────────────────────────────────
export function CloseIcon(p: IconProps) {
  return (
    <svg {...def(24, "currentColor", 2, p)}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── SOUND ON ────────────────────────────────────────────
export function SoundIcon(p: IconProps) {
  return (
    <svg {...def(24, "currentColor", 1.5, p)}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

// ─── MUTE ────────────────────────────────────────────────
export function MuteIcon(p: IconProps) {
  return (
    <svg {...def(24, "currentColor", 1.5, p)}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

// ─── RESET / TRASH ───────────────────────────────────────
export function TrashIcon(p: IconProps) {
  return (
    <svg {...def(24, "currentColor", 1.5, p)}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

// ─── STAR ────────────────────────────────────────────────
export function StarIcon(p: IconProps) {
  const filled = p.color ?? "currentColor";
  return (
    <svg {...def(24, "currentColor", 1.5, p)}>
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        fill={filled}
        stroke={filled}
      />
    </svg>
  );
}

// ─── UPGRADE ICONS ──────────────────────────────────────

// Better Dough — wheat stalk
export function FlourIcon(p: IconProps) {
  return (
    <svg {...def(32, "currentColor", 1.5, p)}>
      <line x1="16" y1="28" x2="16" y2="6" />
      <path d="M16 22 Q10 18 10 13 Q10 9 16 10" />
      <path d="M16 18 Q22 14 22 9 Q22 5 16 6" />
      <path d="M16 15 Q10 12 12 8" />
      <path d="M16 12 Q20 10 20 6" />
    </svg>
  );
}

// Fancy Cheese — wedge
export function CheeseIcon(p: IconProps) {
  return (
    <svg {...def(32, "currentColor", 1.5, p)}>
      <path d="M4 24 L16 8 L28 24 Z" />
      <line x1="4" y1="24" x2="28" y2="24" />
      <circle cx="13" cy="19" r="2" />
      <circle cx="20" cy="21" r="1.5" />
      <circle cx="17" cy="14" r="1.5" />
    </svg>
  );
}

// Secret Sauce — sauce bottle
export function SauceIcon(p: IconProps) {
  return (
    <svg {...def(32, "currentColor", 1.5, p)}>
      <path d="M12 6 L12 4 Q12 2 14 2 L18 2 Q20 2 20 4 L20 6" />
      <rect x="10" y="6" width="12" height="20" rx="3" />
      <line x1="13" y1="12" x2="19" y2="12" />
      <line x1="13" y1="15" x2="19" y2="15" />
      <line x1="13" y1="18" x2="19" y2="18" />
    </svg>
  );
}

// Wood-Fired Oven — arch oven
export function OvenIcon(p: IconProps) {
  return (
    <svg {...def(32, "currentColor", 1.5, p)}>
      <path d="M4 26 L4 16 Q4 6 16 6 Q28 6 28 16 L28 26 Z" />
      <path d="M4 26 L28 26" />
      <path d="M11 26 L11 18 Q11 13 16 13 Q21 13 21 18 L21 26" />
      {/* Flame */}
      <path d="M16 11 Q14 8 16 6 Q18 8 17 10 Q19 7 20 5 Q21 9 18 11" fill={p.color ?? "currentColor"} stroke="none" />
    </svg>
  );
}

// Delivery Bike — bicycle with box
export function BikeIcon(p: IconProps) {
  return (
    <svg {...def(32, "currentColor", 1.5, p)}>
      <circle cx="8" cy="22" r="5" />
      <circle cx="24" cy="22" r="5" />
      <path d="M8 22 L14 12 L24 22" />
      <line x1="14" y1="12" x2="18" y2="12" />
      <rect x="17" y="8" width="9" height="7" rx="1" />
    </svg>
  );
}

// Pizza Robot — robot head
export function RobotIcon(p: IconProps) {
  return (
    <svg {...def(32, "currentColor", 1.5, p)}>
      <rect x="8" y="12" width="16" height="14" rx="2" />
      <rect x="11" y="8" width="10" height="6" rx="1" />
      <line x1="16" y1="8" x2="16" y2="4" />
      <circle cx="16" cy="3" r="1.5" />
      <rect x="11" y="16" width="4" height="3" rx="0.5" />
      <rect x="17" y="16" width="4" height="3" rx="0.5" />
      <line x1="4" y1="16" x2="8" y2="18" />
      <line x1="28" y1="16" x2="24" y2="18" />
      <line x1="10" y1="26" x2="10" y2="30" />
      <line x1="22" y1="26" x2="22" y2="30" />
    </svg>
  );
}

// Second Location — building with pin
export function StorefrontIcon(p: IconProps) {
  return (
    <svg {...def(32, "currentColor", 1.5, p)}>
      <rect x="4" y="14" width="18" height="14" />
      <path d="M4 14 L4 8 L22 8 L22 14" />
      <path d="M2 14 L24 14" />
      <path d="M10 28 L10 21 Q10 18 13 18 Q16 18 16 21 L16 28" />
      {/* Second location marker */}
      <path d="M24 4 Q24 0 28 0 Q32 0 32 4 Q32 8 28 12 Q24 8 24 4 Z" />
      <circle cx="28" cy="4" r="1.5" fill={p.color ?? "currentColor"} stroke="none" />
    </svg>
  );
}

// TV — television screen
export function TVIcon(p: IconProps) {
  return (
    <svg {...def(32, "currentColor", 1.5, p)}>
      <rect x="2" y="6" width="28" height="18" rx="2" />
      <line x1="12" y1="26" x2="12" y2="30" />
      <line x1="20" y1="26" x2="20" y2="30" />
      <line x1="8" y1="30" x2="24" y2="30" />
      {/* Screen content — pizza slice shape */}
      <path d="M10 20 L16 10 L22 20 Z" />
    </svg>
  );
}

// Franchise — handshake / contract
export function FranchiseIcon(p: IconProps) {
  return (
    <svg {...def(32, "currentColor", 1.5, p)}>
      <path d="M2 20 L8 14 L13 17 L20 10 L24 14 L30 8" />
      <path d="M2 26 L30 26" />
      <path d="M2 4 L30 4" />
      <path d="M2 10 L10 10" />
      <path d="M22 4 L22 8" />
    </svg>
  );
}

// International — globe
export function GlobeIcon(p: IconProps) {
  return (
    <svg {...def(32, "currentColor", 1.5, p)}>
      <circle cx="16" cy="16" r="13" />
      <ellipse cx="16" cy="16" rx="6" ry="13" />
      <line x1="3" y1="12" x2="29" y2="12" />
      <line x1="3" y1="20" x2="29" y2="20" />
    </svg>
  );
}

// Drone — quadcopter
export function DroneIcon(p: IconProps) {
  return (
    <svg {...def(32, "currentColor", 1.5, p)}>
      {/* Body */}
      <rect x="11" y="13" width="10" height="6" rx="1.5" />
      {/* Arms */}
      <line x1="11" y1="14" x2="5" y2="10" />
      <line x1="21" y1="14" x2="27" y2="10" />
      <line x1="11" y1="18" x2="5" y2="22" />
      <line x1="21" y1="18" x2="27" y2="22" />
      {/* Propellers */}
      <ellipse cx="5" cy="9" rx="4" ry="1.5" />
      <ellipse cx="27" cy="9" rx="4" ry="1.5" />
      <ellipse cx="5" cy="23" rx="4" ry="1.5" />
      <ellipse cx="27" cy="23" rx="4" ry="1.5" />
      {/* Camera */}
      <circle cx="16" cy="20" r="1" fill={p.color ?? "currentColor"} stroke="none" />
    </svg>
  );
}

// Space Pizza Lab — rocket
export function RocketIcon(p: IconProps) {
  return (
    <svg {...def(32, "currentColor", 1.5, p)}>
      <path d="M16 2 Q22 8 22 18 L16 22 L10 18 Q10 8 16 2 Z" />
      <path d="M10 18 L6 24 L10 22" />
      <path d="M22 18 L26 24 L22 22" />
      <circle cx="16" cy="12" r="3" />
      {/* Flame */}
      <path d="M13 22 Q14 28 16 30 Q18 28 19 22" />
    </svg>
  );
}

// ─── WORKER ICONS ───────────────────────────────────────

// Pizza Boy — person on scooter
export function ScooterIcon(p: IconProps) {
  return (
    <svg {...def(32, "currentColor", 1.5, p)}>
      {/* Rider */}
      <circle cx="20" cy="8" r="3" />
      <path d="M20 11 L18 17 L22 17" />
      {/* Scooter body */}
      <path d="M8 18 L26 18 L24 22 L10 22 Z" />
      <path d="M26 18 L28 14 L24 13 L22 17" />
      {/* Wheels */}
      <circle cx="10" cy="24" r="3" />
      <circle cx="24" cy="24" r="3" />
      {/* Box */}
      <rect x="6" y="14" width="8" height="6" rx="1" />
    </svg>
  );
}

// Line Cook — apron silhouette
export function CookIcon(p: IconProps) {
  return (
    <svg {...def(32, "currentColor", 1.5, p)}>
      <circle cx="16" cy="7" r="4" />
      <path d="M10 14 Q10 11 16 11 Q22 11 22 14 L22 28 L10 28 Z" />
      {/* Apron strings */}
      <path d="M10 14 L8 12" />
      <path d="M22 14 L24 12" />
      {/* Apron pocket */}
      <rect x="13" y="18" width="6" height="5" rx="1" />
    </svg>
  );
}

// Head Chef — toque hat
export function ChefHatIcon(p: IconProps) {
  return (
    <svg {...def(32, "currentColor", 1.5, p)}>
      {/* Hat */}
      <path d="M8 18 Q8 8 16 6 Q24 8 24 18" />
      <rect x="6" y="18" width="20" height="4" rx="1" />
      <path d="M16 6 Q13 2 10 4 Q7 6 8 10" />
      <path d="M16 6 Q19 2 22 4 Q25 6 24 10" />
      {/* Face below */}
      <circle cx="16" cy="26" r="3" />
    </svg>
  );
}

// Kitchen Manager — clipboard
export function ClipboardIcon(p: IconProps) {
  return (
    <svg {...def(32, "currentColor", 1.5, p)}>
      <rect x="6" y="6" width="20" height="24" rx="2" />
      <path d="M12 6 L12 4 Q12 2 14 2 L18 2 Q20 2 20 4 L20 6" />
      <line x1="10" y1="13" x2="22" y2="13" />
      <line x1="10" y1="17" x2="22" y2="17" />
      <line x1="10" y1="21" x2="16" y2="21" />
      <polyline points="17 21 19 23 22 19" />
    </svg>
  );
}

// Restaurant Manager — briefcase
export function BriefcaseIcon(p: IconProps) {
  return (
    <svg {...def(32, "currentColor", 1.5, p)}>
      <rect x="4" y="12" width="24" height="16" rx="2" />
      <path d="M12 12 L12 9 Q12 7 14 7 L18 7 Q20 7 20 9 L20 12" />
      <line x1="4" y1="20" x2="28" y2="20" />
      <line x1="16" y1="16" x2="16" y2="24" />
    </svg>
  );
}

// Regional Director — city building
export function BuildingIcon(p: IconProps) {
  return (
    <svg {...def(32, "currentColor", 1.5, p)}>
      <rect x="6" y="4" width="20" height="26" />
      <rect x="2" y="14" width="6" height="16" />
      <rect x="24" y="10" width="6" height="20" />
      <rect x="10" y="8" width="3" height="3" />
      <rect x="16" y="8" width="3" height="3" />
      <rect x="10" y="14" width="3" height="3" />
      <rect x="16" y="14" width="3" height="3" />
      <rect x="10" y="20" width="3" height="3" />
      <rect x="16" y="20" width="3" height="3" />
      <rect x="13" y="26" width="6" height="4" />
    </svg>
  );
}

// Corporate Executive — top hat + tie
export function ExecutiveIcon(p: IconProps) {
  return (
    <svg {...def(32, "currentColor", 1.5, p)}>
      {/* Hat */}
      <rect x="9" y="8" width="14" height="8" rx="1" />
      <path d="M7 16 L25 16" />
      <path d="M11 8 L11 4 Q11 2 16 2 Q21 2 21 4 L21 8" />
      {/* Body/suit */}
      <path d="M10 18 Q10 16 16 16 Q22 16 22 18 L22 30 L10 30 Z" />
      {/* Tie */}
      <path d="M16 18 L14 22 L16 24 L18 22 Z" />
      <path d="M14 22 L15 28 L16 24 L17 28 L18 22" />
    </svg>
  );
}

// ─── UI UTILITY ICONS ────────────────────────────────────

// Info circle
export function InfoIcon(p: IconProps) {
  return (
    <svg {...def(24, "currentColor", 1.5, p)}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth={2.5} />
    </svg>
  );
}

// Time/clock (offline earnings)
export function ClockIcon(p: IconProps) {
  return (
    <svg {...def(24, "currentColor", 1.5, p)}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// Lightning bolt (per-click income)
export function BoltIcon(p: IconProps) {
  return (
    <svg {...def(24, "currentColor", 1.5, p)}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={p.color ?? "currentColor"} stroke="none" />
    </svg>
  );
}

// Trend up (income rate)
export function TrendIcon(p: IconProps) {
  return (
    <svg {...def(24, "currentColor", 1.5, p)}>
      <polyline points="23 6 13 16 9 12 1 20" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

// Crown (empire rank)
export function CrownIcon(p: IconProps) {
  return (
    <svg {...def(24, "currentColor", 1.5, p)}>
      <path d="M2 18 L6 8 L12 14 L18 4 L24 8 L22 18 Z" />
      <line x1="2" y1="18" x2="22" y2="18" />
      <circle cx="12" cy="14" r="1.5" fill={p.color ?? "currentColor"} stroke="none" />
      <circle cx="5.5" cy="9" r="1.5" fill={p.color ?? "currentColor"} stroke="none" />
      <circle cx="18.5" cy="5" r="1.5" fill={p.color ?? "currentColor"} stroke="none" />
    </svg>
  );
}

// Hand clicking (prompt for interaction)
export function ClickIcon(p: IconProps) {
  return (
    <svg {...def(24, "currentColor", 1.5, p)}>
      <path d="M9 11V6a2 2 0 0 1 4 0v3" />
      <path d="M13 9a2 2 0 0 1 4 0v2" />
      <path d="M17 11a2 2 0 0 1 4 0v4a6 6 0 0 1-6 6H9a5 5 0 0 1-5-5v-1a2 2 0 0 1 4 0" />
      <path d="M9 11a2 2 0 0 1-4 0V6a2 2 0 0 1 4 0v5Z" />
    </svg>
  );
}

// Warning triangle
export function WarningIcon(p: IconProps) {
  return (
    <svg {...def(24, "currentColor", 1.5, p)}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth={2.5} />
    </svg>
  );
}
