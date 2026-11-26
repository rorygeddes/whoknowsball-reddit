import { TIERS } from '../../shared/game';
import Icon from './Icon';
export default function TierBadge({ tier, big }) {
  const t = TIERS[tier] || TIERS.miss;
  return (
    <span
      className={`tier ${big ? 'tier-big' : ''}`}
      style={{ '--c': t.color }}
    >
      <Icon name={t.icon} size={big ? 20 : 15} /> {t.label} <b>+{t.points}</b>
    </span>
  );
}
