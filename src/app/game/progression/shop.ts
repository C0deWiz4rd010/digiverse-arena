import { THEME_OPTIONS, type ThemeId } from '../../core/settings/settings.model';

export interface ShopThemeItem {
  kind: 'theme';
  id: ThemeId;
  label: string;
  hint: string;
  swatch: [string, string];
  price: number;
}

export interface ShopTitleItem {
  kind: 'title';
  id: string;
  label: string;
  hint: string;
  price: number;
}

export type ShopItem = ShopThemeItem | ShopTitleItem;

/** Purchasable neon themes (all premium theme options). */
export const SHOP_THEMES: readonly ShopThemeItem[] = THEME_OPTIONS.filter((t) => t.premium).map(
  (t) => ({
    kind: 'theme',
    id: t.id,
    label: t.label,
    hint: t.hint,
    swatch: t.swatch,
    price: 250,
  }),
);

/** Purchasable cosmetic titles shown on the profile. */
export const SHOP_TITLES: readonly ShopTitleItem[] = [
  { kind: 'title', id: 'Digi-Ace', label: 'Digi-Ace', hint: 'For the confident', price: 150 },
  { kind: 'title', id: 'Data Ghost', label: 'Data Ghost', hint: 'Silent and precise', price: 150 },
  { kind: 'title', id: 'Nexus Warden', label: 'Nexus Warden', hint: 'Keeper of the link', price: 220 },
  { kind: 'title', id: 'Arena Phantom', label: 'Arena Phantom', hint: 'Undefeated aura', price: 220 },
  { kind: 'title', id: 'Grand Tamer', label: 'Grand Tamer', hint: 'A prestige title', price: 400 },
];
