// One icon set for the whole app (no emojis). UI icons come from lucide; sport icons are drawn here in the same line style.
import {
  Trophy,
  Crown,
  Shield,
  Flame,
  Target,
  Timer,
  X,
  Check,
  Lock,
  Eye,
  Pencil,
  ArrowLeftRight,
  Settings,
  Heart,
  Plus,
  Tv,
  Lightbulb,
  BrickWall,
  Medal,
  Award,
  IdCard,
  Hand,
  Star,
  Play,
  Zap,
  TrendingUp,
  Sparkles,
  Flag,
  CarFront,
  CircleDot,
  Armchair,
  Landmark,
  BarChart3,
  CalendarDays,
  Save,
  ChevronRight,
  ChevronDown,
  Circle,
  Gauge,
  Radio,
  Copy,
  ListPlus,
  ClipboardPaste,
  AlertTriangle,
  Bell,
} from 'lucide-react';

const base = (size, color, strokeWidth) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: color,
  strokeWidth,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
});
const sport = (paths) =>
  function SportIcon({
    size = 24,
    color = 'currentColor',
    strokeWidth = 2,
    ...rest
  }) {
    return (
      <svg {...base(size, color, strokeWidth)} {...rest}>
        {paths}
      </svg>
    );
  };

const Hockey = sport(
  <>
    <path d="M14 3 8.5 17.5a2 2 0 0 1-1.9 1.3H3v-3h3.2L11.5 3" />
    <path d="M15 19h6" />
    <ellipse cx="18" cy="16.5" rx="3" ry="1.2" />
  </>
);
const Basketball = sport(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3v18" />
    <path d="M5.6 5.6c3 2.6 3 10.2 0 12.8M18.4 5.6c-3 2.6-3 10.2 0 12.8" />
  </>
);
const Football = sport(
  <>
    <path d="M5 19C3 13 7 5 19 5c2 6-2 14-14 14Z" />
    <path d="m9 15 6-6M10.5 10.5l3 3M12 9l3 3M9 12l3 3" />
  </>
);
const Baseball = sport(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M6.3 5.1c2.2 2 2.2 11.8 0 13.8M17.7 5.1c-2.2 2-2.2 11.8 0 13.8" />
  </>
);
const Soccer = sport(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m12 7.5 3.3 2.4-1.3 3.9h-4l-1.3-3.9Z" />
    <path d="M12 3v4.5M15.3 9.9l4.3-1.4M14 13.8l2.7 3.7M10 13.8l-2.7 3.7M8.7 9.9 4.4 8.5" />
  </>
);
const Tennis = sport(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M5.6 5.6a9 9 0 0 1 0 12.8M18.4 5.6a9 9 0 0 0 0 12.8" />
  </>
);
const Olympics = sport(
  <>
    <circle cx="5.5" cy="10" r="3" />
    <circle cx="12" cy="10" r="3" />
    <circle cx="18.5" cy="10" r="3" />
    <circle cx="8.75" cy="14" r="3" />
    <circle cx="15.25" cy="14" r="3" />
  </>
);
const Boxing = sport(
  <>
    <path d="M7 21v-4c-2-1-3-3-3-6a6 6 0 0 1 6-6h3a5 5 0 0 1 5 5v3a4 4 0 0 1-3 3.9V21Z" />
    <path d="M7 11h5M7 21h8" />
  </>
);

const ICONS = {
  trophy: Trophy,
  crown: Crown,
  shield: Shield,
  flame: Flame,
  target: Target,
  timer: Timer,
  x: X,
  check: Check,
  lock: Lock,
  eye: Eye,
  pencil: Pencil,
  trade: ArrowLeftRight,
  settings: Settings,
  heart: Heart,
  plus: Plus,
  tv: Tv,
  hint: Lightbulb,
  wall: BrickWall,
  medal: Medal,
  award: Award,
  idcard: IdCard,
  hand: Hand,
  star: Star,
  play: Play,
  zap: Zap,
  trending: TrendingUp,
  sparkles: Sparkles,
  flag: Flag,
  car: CarFront,
  live: CircleDot,
  bench: Armchair,
  stadium: Landmark,
  chart: BarChart3,
  calendar: CalendarDays,
  save: Save,
  next: ChevronRight,
  down: ChevronDown,
  circle: Circle,
  gauge: Gauge,
  radio: Radio,
  copy: Copy,
  listplus: ListPlus,
  paste: ClipboardPaste,
  warn: AlertTriangle,
  bell: Bell,
  hockey: Hockey,
  basketball: Basketball,
  football: Football,
  baseball: Baseball,
  soccer: Soccer,
  tennis: Tennis,
  golf: Flag,
  olympics: Olympics,
  f1: CarFront,
  boxing: Boxing,
};

export default function Icon({
  name,
  size = 18,
  color = 'currentColor',
  strokeWidth = 2.2,
  className = '',
  ...rest
}) {
  const C = ICONS[name] || Circle;
  return (
    <C
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={`ic ${className}`}
      aria-hidden
      {...rest}
    />
  );
}
