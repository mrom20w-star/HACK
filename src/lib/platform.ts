export const BRAND_NAME = 'كراش هاك';
export const EMBLEM_SRC = '/src/assets/images/club_emblem_1795129691415.jpg';
export const APPLE_ICON_SRC = '/src/assets/images/apple_game_icon_1795129691586.jpg';
export const CRASH_ICON_SRC = '/src/assets/images/crash_game_icon_1795129691793.jpg';

export const PROMO_CODE = 'w777';

export interface DepositOption {
  symbol: string;
  value: string;
  unit: string;
  note: string;
}

export const DEPOSIT_OPTIONS: DepositOption[] = [
  {symbol: '£', value: '250', unit: 'EGP', note: 'جنيه مصري'},
  {symbol: '$', value: '5', unit: 'USD', note: 'دولار'},
];

export const ADMIN_SECRET_ID = '000111000';
export const VIP_SIGNAL_CODE = '1729018123';
