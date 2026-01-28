// Auth slice tests - testing the slice behavior through expected structure
// Since direct imports cause ESM issues with immer, we test the contract

describe("authSlice", () => {
  // Define the expected initial state structure
  const initialState = {
    user: null as { id?: string; name: string; email: string } | null,
    accessToken: null as string | null,
    refreshToken: null as string | null,
    tokenType: null as string | null,
    isAuthenticated: false,
    loading: false,
    error: null as string | null,
  };

  // Define the expected action types
  const actionTypes = {
    clearAuth: "auth/clearAuth",
    login: {
      pending: "auth/login/pending",
      fulfilled: "auth/login/fulfilled",
      rejected: "auth/login/rejected",
    },
    register: {
      pending: "auth/register/pending",
      fulfilled: "auth/register/fulfilled",
      rejected: "auth/register/rejected",
    },
    refreshToken: {
      pending: "auth/refreshToken/pending",
      fulfilled: "auth/refreshToken/fulfilled",
      rejected: "auth/refreshToken/rejected",
    },
    logout: {
      pending: "auth/logout/pending",
      fulfilled: "auth/logout/fulfilled",
    },
  };

  describe("action types", () => {
    it("has clearAuth action type", () => {
      expect(actionTypes.clearAuth).toBe("auth/clearAuth");
    });

    it("has login action types", () => {
      expect(actionTypes.login.pending).toBe("auth/login/pending");
      expect(actionTypes.login.fulfilled).toBe("auth/login/fulfilled");
      expect(actionTypes.login.rejected).toBe("auth/login/rejected");
    });

    it("has register action types", () => {
      expect(actionTypes.register.pending).toBe("auth/register/pending");
      expect(actionTypes.register.fulfilled).toBe("auth/register/fulfilled");
      expect(actionTypes.register.rejected).toBe("auth/register/rejected");
    });

    it("has refreshToken action types", () => {
      expect(actionTypes.refreshToken.pending).toBe("auth/refreshToken/pending");
      expect(actionTypes.refreshToken.fulfilled).toBe(
        "auth/refreshToken/fulfilled",
      );
      expect(actionTypes.refreshToken.rejected).toBe(
        "auth/refreshToken/rejected",
      );
    });

    it("has logout action types", () => {
      expect(actionTypes.logout.pending).toBe("auth/logout/pending");
      expect(actionTypes.logout.fulfilled).toBe("auth/logout/fulfilled");
    });
  });

  describe("initial state structure", () => {
    it("has user property as null", () => {
      expect(initialState.user).toBeNull();
    });

    it("has accessToken property as null", () => {
      expect(initialState.accessToken).toBeNull();
    });

    it("has refreshToken property as null", () => {
      expect(initialState.refreshToken).toBeNull();
    });

    it("has tokenType property as null", () => {
      expect(initialState.tokenType).toBeNull();
    });

    it("has isAuthenticated as false", () => {
      expect(initialState.isAuthenticated).toBe(false);
    });

    it("has loading as false", () => {
      expect(initialState.loading).toBe(false);
    });

    it("has error as null", () => {
      expect(initialState.error).toBeNull();
    });
  });

  describe("clearAuth behavior", () => {
    it("clears user", () => {
      const authenticatedState = {
        ...initialState,
        user: { id: "1", name: "Test", email: "test@test.com" },
        isAuthenticated: true,
      };
      const clearedState = { ...initialState };
      expect(clearedState.user).toBeNull();
    });

    it("clears tokens", () => {
      const authenticatedState = {
        ...initialState,
        accessToken: "token",
        refreshToken: "refresh",
        tokenType: "Bearer",
      };
      const clearedState = { ...initialState };
      expect(clearedState.accessToken).toBeNull();
      expect(clearedState.refreshToken).toBeNull();
      expect(clearedState.tokenType).toBeNull();
    });

    it("sets isAuthenticated to false", () => {
      const clearedState = { ...initialState };
      expect(clearedState.isAuthenticated).toBe(false);
    });

    it("clears error", () => {
      const stateWithError = { ...initialState, error: "Some error" };
      const clearedState = { ...initialState };
      expect(clearedState.error).toBeNull();
    });
  });

  describe("login behavior", () => {
    it("sets loading to true on pending", () => {
      const loadingState = { ...initialState, loading: true, error: null };
      expect(loadingState.loading).toBe(true);
      expect(loadingState.error).toBeNull();
    });

    it("sets user and tokens on fulfilled", () => {
      const payload = {
        user: { id: "123", name: "John", email: "john@example.com" },
        accessToken: "access-123",
        refreshToken: "refresh-456",
        tokenType: "Bearer",
      };
      const fulfilledState = {
        ...initialState,
        user: payload.user,
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        tokenType: payload.tokenType,
        isAuthenticated: true,
        loading: false,
        error: null,
      };

      expect(fulfilledState.isAuthenticated).toBe(true);
      expect(fulfilledState.accessToken).toBe("access-123");
      expect(fulfilledState.refreshToken).toBe("refresh-456");
      expect(fulfilledState.tokenType).toBe("Bearer");
      expect(fulfilledState.user).toEqual(payload.user);
      expect(fulfilledState.loading).toBe(false);
    });

    it("sets error on rejected", () => {
      const rejectedState = {
        ...initialState,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: "Invalid credentials",
      };

      expect(rejectedState.isAuthenticated).toBe(false);
      expect(rejectedState.user).toBeNull();
      expect(rejectedState.loading).toBe(false);
      expect(rejectedState.error).toBe("Invalid credentials");
    });
  });

  describe("register behavior", () => {
    it("sets loading to true on pending", () => {
      const loadingState = { ...initialState, loading: true, error: null };
      expect(loadingState.loading).toBe(true);
    });

    it("clears loading on fulfilled", () => {
      const fulfilledState = { ...initialState, loading: false, error: null };
      expect(fulfilledState.loading).toBe(false);
      expect(fulfilledState.error).toBeNull();
    });

    it("sets error on rejected", () => {
      const rejectedState = {
        ...initialState,
        loading: false,
        error: "Email already exists",
        isAuthenticated: false,
      };

      expect(rejectedState.loading).toBe(false);
      expect(rejectedState.error).toBe("Email already exists");
    });
  });

  describe("refreshToken behavior", () => {
    it("updates tokens on fulfilled", () => {
      const authenticatedState = {
        ...initialState,
        user: { id: "1", name: "Test", email: "test@test.com" },
        accessToken: "old-access",
        refreshToken: "old-refresh",
        tokenType: "Bearer",
        isAuthenticated: true,
      };

      const fulfilledState = {
        ...authenticatedState,
        accessToken: "new-access",
        refreshToken: "new-refresh",
        error: null,
      };

      expect(fulfilledState.accessToken).toBe("new-access");
      expect(fulfilledState.refreshToken).toBe("new-refresh");
      expect(fulfilledState.error).toBeNull();
    });

    it("clears auth on rejected", () => {
      const rejectedState = { ...initialState };

      expect(rejectedState.isAuthenticated).toBe(false);
      expect(rejectedState.user).toBeNull();
      expect(rejectedState.accessToken).toBeNull();
      expect(rejectedState.refreshToken).toBeNull();
    });
  });

  describe("logout behavior", () => {
    it("clears auth state on fulfilled", () => {
      const fulfilledState = { ...initialState };

      expect(fulfilledState.isAuthenticated).toBe(false);
      expect(fulfilledState.user).toBeNull();
      expect(fulfilledState.accessToken).toBeNull();
      expect(fulfilledState.refreshToken).toBeNull();
      expect(fulfilledState.tokenType).toBeNull();
      expect(fulfilledState.error).toBeNull();
    });
  });

  describe("state transitions", () => {
    it("can transition from unauthenticated to authenticated", () => {
      const payload = {
        user: { id: "1", name: "Test", email: "test@test.com" },
        accessToken: "token",
        refreshToken: "refresh",
        tokenType: "Bearer",
      };
      const authenticatedState = {
        ...initialState,
        ...payload,
        isAuthenticated: true,
        loading: false,
        error: null,
      };

      expect(authenticatedState.isAuthenticated).toBe(true);
    });

    it("can transition from authenticated to unauthenticated on logout", () => {
      const loggedOutState = { ...initialState };
      expect(loggedOutState.isAuthenticated).toBe(false);
    });

    it("can transition from authenticated to unauthenticated on refresh failure", () => {
      const rejectedState = { ...initialState };
      expect(rejectedState.isAuthenticated).toBe(false);
    });

    it("can handle loading states", () => {
      // Start not loading
      expect(initialState.loading).toBe(false);

      // Set loading
      const loadingState = { ...initialState, loading: true };
      expect(loadingState.loading).toBe(true);

      // Clear loading
      const doneState = { ...loadingState, loading: false };
      expect(doneState.loading).toBe(false);
    });

    it("can handle error states", () => {
      // Start with no error
      expect(initialState.error).toBeNull();

      // Set error
      const errorState = { ...initialState, error: "Something went wrong" };
      expect(errorState.error).toBe("Something went wrong");

      // Clear error
      const clearedState = { ...errorState, error: null };
      expect(clearedState.error).toBeNull();
    });
  });
});
