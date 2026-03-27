import { cn } from '@/lib/cn';

const TIER_CONFIG = {
  bronze: { label: 'Bronze', color: 'text-[#CD7F32]', bg: 'bg-[#CD7F32]/10', border: 'border-[#CD7F32]/30' },
  silver: { label: 'Silver', color: 'text-[#C0C0C0]', bg: 'bg-[#C0C0C0]/10', border: 'border-[#C0C0C0]/30' },
  gold: { label: 'Gold', color: 'text-[#FFD700]', bg: 'bg-[#FFD700]/10', border: 'border-[#FFD700]/30' },
  diamond: { label: 'Diamond', color: 'text-[#00BFFF]', bg: 'bg-[#00BFFF]/10', border: 'border-[#00BFFF]/30' },
  legendary: { label: 'Legendary', color: 'text-[#A855F7]', bg: 'bg-[#A855F7]/10', border: 'border-[#A855F7]/30' },
};

interface TierBadgeProps {
  tier: keyof typeof TIER_CONFIG;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function TierBadge({ tier, size = 'md', showLabel = true }: TierBadgeProps) {
  const config = TIER_CONFIG[tier];
  const sizeClass = { sm: 'text-xs px-1.5 py-0.5', md: 'text-sm px-2 py-0.5', lg: 'text-base px-3 py-1' }[size];

  return (
    <span className={cn('inline-flex items-center rounded-full border font-medium', config.color, config.bg, config.border, sizeClass)}>
      {showLabel && config.label}
    </span>
  );
}
