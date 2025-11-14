import { ThunkAction } from "redux-thunk";
import { RootState } from "../index";
import { ThemeActionTypes, ThemeMode } from "../types/themeTypes";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_STORAGE_KEY = "@app_theme_mode";

// Action Creators
export const setThemeMode = (mode: ThemeMode): ThemeActionTypes => ({
  type: "SET_THEME_MODE",
  payload: mode,
});

export const loadThemeMode = (mode: ThemeMode): ThemeActionTypes => ({
  type: "LOAD_THEME_MODE",
  payload: mode,
});

// Thunk Action to set and persist theme mode
export const setThemeModePersisted = (
  mode: ThemeMode
): ThunkAction<Promise<void>, RootState, unknown, ThemeActionTypes> => {
  return async (dispatch) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      dispatch(setThemeMode(mode));
    } catch (error) {
      console.error("Failed to save theme mode:", error);
      // Still dispatch the action even if storage fails
      dispatch(setThemeMode(mode));
    }
  };
};

// Thunk Action to load theme mode from storage
export const loadThemeModeFromStorage = (): ThunkAction<
  Promise<void>,
  RootState,
  unknown,
  ThemeActionTypes
> => {
  return async (dispatch) => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (
        savedMode &&
        (savedMode === "light" ||
          savedMode === "dark" ||
          savedMode === "system")
      ) {
        dispatch(loadThemeMode(savedMode as ThemeMode));
      }
    } catch (error) {
      console.error("Failed to load theme mode:", error);
    }
  };
};
