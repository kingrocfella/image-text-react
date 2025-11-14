export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeState {
  mode: ThemeMode;
}

export type ThemeActionTypes =
  | { type: 'SET_THEME_MODE'; payload: ThemeMode }
  | { type: 'LOAD_THEME_MODE'; payload: ThemeMode };

