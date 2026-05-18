// 球员数据 - 类型定义

export interface PlayerStats {
  SHO: number; // 投射
  SLA: number; // 突破
  DEF: number; // 防守
  ATH: number; // 运动
  PLM: number; // 组织
  PHY: number; // 对抗
  REB: number; // 篮板
  CLU: number; // 关键
}

export interface Badge {
  name: string;
  level: 'bronze' | 'silver' | 'gold' | 'purple';
}

export interface Player {
  id: number;
  name_cn: string;
  name_en: string;
  nickname: string;
  team: string;
  position: string;
  jersey_number: number;
  height: number;
  weight: number;
  birth_year: number;
  player_type: string;
  tier: string;
  card_tier: string;
  stats: PlayerStats;
  ovr: number;
  badges: Badge[];
  is_legend: boolean;
  era: string | null;
  pid?: number;
}

export interface PackCard extends Player {
  packSlot: number;      // 属于第几包 (0-4)
  cardIndex: number;     // 在包内的位置 (0-9)
  revealOrder: number;   // 展示顺序
}

export type Rarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR';

export interface RarityConfig {
  name: string;
  color: string;
  bgGradient: string;
  glowColor: string;
  borderClass: string;
  accentColor: string;
  textColor: string;
  statBarColor: string;
}

export const RARITY_CONFIGS: Record<Rarity, RarityConfig> = {
  N: {
    name: '普通',
    color: '#6B7280',
    bgGradient: 'from-gray-800 to-gray-900',
    glowColor: 'rgba(107,114,128,0.5)',
    borderClass: 'border-gray-500',
    accentColor: '#9CA3AF',
    textColor: '#D1D5DB',
    statBarColor: '#6B7280',
  },
  R: {
    name: '稀有',
    color: '#3B82F6',
    bgGradient: 'from-blue-900 to-blue-950',
    glowColor: 'rgba(59,130,246,0.6)',
    borderClass: 'border-blue-500',
    accentColor: '#60A5FA',
    textColor: '#BFDBFE',
    statBarColor: '#3B82F6',
  },
  SR: {
    name: '超级稀有',
    color: '#8B5CF6',
    bgGradient: 'from-purple-900 to-purple-950',
    glowColor: 'rgba(139,92,246,0.6)',
    borderClass: 'border-purple-500',
    accentColor: '#A78BFA',
    textColor: '#DDD6FE',
    statBarColor: '#8B5CF6',
  },
  SSR: {
    name: '传说',
    color: '#F59E0B',
    bgGradient: 'from-amber-900 to-yellow-950',
    glowColor: 'rgba(245,158,11,0.6)',
    borderClass: 'border-amber-500',
    accentColor: '#FCD34D',
    textColor: '#FDE68A',
    statBarColor: '#F59E0B',
  },
  UR: {
    name: '终极',
    color: '#EF4444',
    bgGradient: 'from-red-900 to-red-950',
    glowColor: 'rgba(239,68,68,0.6)',
    borderClass: 'border-red-500',
    accentColor: '#FB7185',
    textColor: '#FECACA',
    statBarColor: '#EF4444',
  },
};

// 位置顺序
export const POSITION_ORDER = ['PG', 'SG', 'SF', 'PF', 'C'];
export const POSITION_NAMES: Record<string, string> = {
  PG: '控球后卫',
  SG: '得分后卫',
  SF: '小前锋',
  PF: '大前锋',
  C: '中锋',
};

// 阵容选择 - 每个位置最多1人
export interface Lineup {
  PG: Player | null;
  SG: Player | null;
  SF: Player | null;
  PF: Player | null;
  C: Player | null;
}

// 位置图标
export const POSITION_ICONS: Record<string, string> = {
  PG: '🎯',
  SG: '🏪',
  SF: '🛡️',
  PF: '💪',
  C: '📐',
};

export const STAT_ICONS: Record<string, string> = {
  SHO: '🎯',
  SLA: '🏪',
  DEF: '🛡️',
  ATH: '🏃',
  PLM: '🧠',
  PHY: '💪',
  REB: '📐',
  CLU: '🔥',
};

export const STAT_LABELS: Record<string, string> = {
  SHO: '投射',
  SLA: '突破',
  DEF: '防守',
  ATH: '运动',
  PLM: '组织',
  PHY: '对抗',
  REB: '篮板',
  CLU: '关键',
};
