// Mock AsyncStorage before any imports
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import themeReducer, {
  setThemeMode,
  setThemeModePersisted,
  loadThemeModeFromStorage,
  type ThemeState,
  type ThemeMode,
} from "../themeSlice";

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

// Mock console.error
const mockConsoleError = jest
  .spyOn(console, "error")
  .mockImplementation(() => {});

describe("themeSlice", () => {
  const initialState: ThemeState = { mode: "system" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe("initial state", () => {
    it("has mode set to system by default", () => {
      const state = themeReducer(undefined, { type: "@@INIT" });
      expect(state.mode).toBe("system");
    });
  });

  describe("setThemeMode reducer", () => {
    it("sets theme mode to light", () => {
      const state = themeReducer(initialState, setThemeMode("light"));
      expect(state.mode).toBe("light");
    });

    it("sets theme mode to dark", () => {
      const state = themeReducer(initialState, setThemeMode("dark"));
      expect(state.mode).toBe("dark");
    });

    it("sets theme mode to system", () => {
      const darkState: ThemeState = { mode: "dark" };
      const state = themeReducer(darkState, setThemeMode("system"));
      expect(state.mode).toBe("system");
    });

    it("can change from light to dark", () => {
      let state = themeReducer(initialState, setThemeMode("light"));
      expect(state.mode).toBe("light");

      state = themeReducer(state, setThemeMode("dark"));
      expect(state.mode).toBe("dark");
    });

    it("handles all valid theme modes", () => {
      const modes: ThemeMode[] = ["light", "dark", "system"];
      modes.forEach((mode) => {
        const state = themeReducer(initialState, setThemeMode(mode));
        expect(state.mode).toBe(mode);
      });
    });
  });

  describe("setThemeModePersisted thunk", () => {
    it("has correct fulfilled action type", () => {
      expect(setThemeModePersisted.fulfilled.type).toBe(
        "theme/setModePersisted/fulfilled",
      );
    });

    it("has correct pending action type", () => {
      expect(setThemeModePersisted.pending.type).toBe(
        "theme/setModePersisted/pending",
      );
    });

    it("has correct rejected action type", () => {
      expect(setThemeModePersisted.rejected.type).toBe(
        "theme/setModePersisted/rejected",
      );
    });

    it("reducer updates state on fulfilled with dark mode", () => {
      const action = {
        type: setThemeModePersisted.fulfilled.type,
        payload: "dark" as ThemeMode,
      };
      const state = themeReducer(initialState, action);
      expect(state.mode).toBe("dark");
    });

    it("reducer updates state on fulfilled with light mode", () => {
      const action = {
        type: setThemeModePersisted.fulfilled.type,
        payload: "light" as ThemeMode,
      };
      const state = themeReducer(initialState, action);
      expect(state.mode).toBe("light");
    });

    it("reducer updates state on fulfilled with system mode", () => {
      const darkState: ThemeState = { mode: "dark" };
      const action = {
        type: setThemeModePersisted.fulfilled.type,
        payload: "system" as ThemeMode,
      };
      const state = themeReducer(darkState, action);
      expect(state.mode).toBe("system");
    });
  });

  describe("loadThemeModeFromStorage thunk", () => {
    it("has correct fulfilled action type", () => {
      expect(loadThemeModeFromStorage.fulfilled.type).toBe(
        "theme/loadFromStorage/fulfilled",
      );
    });

    it("has correct pending action type", () => {
      expect(loadThemeModeFromStorage.pending.type).toBe(
        "theme/loadFromStorage/pending",
      );
    });

    it("has correct rejected action type", () => {
      expect(loadThemeModeFromStorage.rejected.type).toBe(
        "theme/loadFromStorage/rejected",
      );
    });

    it("reducer updates state on fulfilled with light mode", () => {
      const action = {
        type: loadThemeModeFromStorage.fulfilled.type,
        payload: "light" as ThemeMode,
      };
      const state = themeReducer(initialState, action);
      expect(state.mode).toBe("light");
    });

    it("reducer updates state on fulfilled with dark mode", () => {
      const action = {
        type: loadThemeModeFromStorage.fulfilled.type,
        payload: "dark" as ThemeMode,
      };
      const state = themeReducer(initialState, action);
      expect(state.mode).toBe("dark");
    });

    it("reducer keeps current state on fulfilled with null payload", () => {
      const lightState: ThemeState = { mode: "light" };
      const action = {
        type: loadThemeModeFromStorage.fulfilled.type,
        payload: null,
      };
      const state = themeReducer(lightState, action);
      expect(state.mode).toBe("light");
    });

    it("reducer keeps current state on fulfilled with undefined payload", () => {
      const darkState: ThemeState = { mode: "dark" };
      const action = {
        type: loadThemeModeFromStorage.fulfilled.type,
        payload: undefined,
      };
      const state = themeReducer(darkState, action);
      expect(state.mode).toBe("dark");
    });
  });

  describe("theme mode transitions", () => {
    it("can transition from system to light", () => {
      const state = themeReducer(initialState, setThemeMode("light"));
      expect(state.mode).toBe("light");
    });

    it("can transition from light to dark", () => {
      const lightState: ThemeState = { mode: "light" };
      const state = themeReducer(lightState, setThemeMode("dark"));
      expect(state.mode).toBe("dark");
    });

    it("can transition from dark to system", () => {
      const darkState: ThemeState = { mode: "dark" };
      const state = themeReducer(darkState, setThemeMode("system"));
      expect(state.mode).toBe("system");
    });

    it("can cycle through all modes", () => {
      let state: ThemeState = { mode: "system" };

      state = themeReducer(state, setThemeMode("light"));
      expect(state.mode).toBe("light");

      state = themeReducer(state, setThemeMode("dark"));
      expect(state.mode).toBe("dark");

      state = themeReducer(state, setThemeMode("system"));
      expect(state.mode).toBe("system");
    });
  });

  describe("reducer edge cases", () => {
    it("returns same state for unknown action type", () => {
      const state = themeReducer(initialState, { type: "UNKNOWN_ACTION" });
      expect(state).toEqual(initialState);
    });

    it("handles undefined initial state", () => {
      const state = themeReducer(undefined, { type: "@@INIT" });
      expect(state.mode).toBe("system");
    });

    it("does not mutate original state", () => {
      const originalState: ThemeState = { mode: "system" };
      const frozenState = Object.freeze(originalState);

      // This should not throw if immutability is respected
      expect(() => {
        themeReducer(frozenState as ThemeState, setThemeMode("dark"));
      }).not.toThrow();
    });
  });

  describe("action creators", () => {
    it("setThemeMode creates correct action", () => {
      const action = setThemeMode("dark");
      expect(action.type).toBe("theme/setThemeMode");
      expect(action.payload).toBe("dark");
    });

    it("setThemeMode creates action for all valid modes", () => {
      const modes: ThemeMode[] = ["light", "dark", "system"];
      modes.forEach((mode) => {
        const action = setThemeMode(mode);
        expect(action.payload).toBe(mode);
      });
    });
  });
});
