import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Types
export type ThemeMode = "light" | "dark" | "system";

export interface ThemeState {
  mode: ThemeMode;
}

const THEME_STORAGE_KEY = "@app_theme_mode";

const initialState: ThemeState = {
  mode: "system",
};

// Async Thunks
export const setThemeModePersisted = createAsyncThunk<ThemeMode, ThemeMode>(
  "theme/setModePersisted",
  async (mode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error("Failed to save theme mode:", error);
    }
    return mode;
  }
);

export const loadThemeModeFromStorage = createAsyncThunk<ThemeMode | null, void>(
  "theme/loadFromStorage",
  async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (
        savedMode &&
        (savedMode === "light" || savedMode === "dark" || savedMode === "system")
      ) {
        return savedMode as ThemeMode;
      }
    } catch (error) {
      console.error("Failed to load theme mode:", error);
    }
    return null;
  }
);

// Slice
const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(setThemeModePersisted.fulfilled, (state, action) => {
        state.mode = action.payload;
      })
      .addCase(loadThemeModeFromStorage.fulfilled, (state, action) => {
        if (action.payload) {
          state.mode = action.payload;
        }
      });
  },
});

export const { setThemeMode } = themeSlice.actions;
export default themeSlice.reducer;
