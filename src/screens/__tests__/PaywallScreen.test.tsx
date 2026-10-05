import React from "react";
import { Alert } from "react-native";
import { render, fireEvent, act } from "@testing-library/react-native";
import PaywallScreen from "../PaywallScreen";
import { useAccount } from "../../hooks";
import {
  PurchaseCancelledError,
  fetchProOffers,
  purchasePro,
  restorePro,
} from "../../billing/purchases";

jest.mock("react-native-paper", () => require("../../testing/paperMock"));
const mockSetQueryData = jest.fn();
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ setQueryData: mockSetQueryData }),
}));
jest.mock("../../store", () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({ auth: { user: { id: "u1" } } }),
}));
jest.mock("../../hooks", () => ({
  ACCOUNT_QUERY_KEY: ["account"],
  useAccount: jest.fn(),
}));
jest.mock("../../billing/purchases", () => {
  class PurchaseCancelledError extends Error {}
  return {
    PurchaseCancelledError,
    fetchProOffers: jest.fn(),
    purchasePro: jest.fn(),
    restorePro: jest.fn(),
    manageProSubscription: jest.fn(() => Promise.resolve()),
  };
});

const FREE = {
  user_id: "u1",
  name: "Ada",
  email: "ada@example.com",
  login_methods: ["password"],
  pro: false,
  pro_source: null,
  pro_product_id: null,
  pro_expires_at: null,
  purchases_available: true,
  models: ["ollama", "gemini"],
  pro_models: ["claude", "openai"],
  usage: {},
  pro_limits: { image: 1000, sound: 300, pdf: 500, cloud_model: 300 },
};
const PRO = {
  ...FREE,
  pro: true,
  pro_source: "subscription",
  pro_expires_at: "2026-11-05T00:00:00Z",
  pro_models: [],
};
const OFFERS = [
  { plan: "monthly", productId: "scangenai_pro_monthly", displayPrice: "$4.99" },
  { plan: "yearly", productId: "scangenai_pro_yearly", displayPrice: "$39.99" },
];

const navigation = { goBack: jest.fn() } as any;
const renderScreen = (reason?: string) =>
  render(
    <PaywallScreen
      navigation={navigation}
      route={{ key: "k", name: "Paywall", params: reason ? { reason } : undefined } as any}
    />,
  );
const account = (data: unknown) =>
  (useAccount as jest.Mock).mockReturnValue({ data });

let alertSpy: jest.SpyInstance;
beforeEach(() => {
  jest.clearAllMocks();
  alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  (fetchProOffers as jest.Mock).mockResolvedValue(OFFERS);
  account(FREE);
});
afterEach(() => alertSpy.mockRestore());

it("lists what Pro adds from the server\'s numbers, with the store\'s prices", async () => {
  const screen = await renderScreen("Claude is part of ScanGenAI Pro.");
  await act(async () => {});

  expect(screen.getByTestId("paywall-reason")).toHaveTextContent(/Claude is part/);
  expect(screen.getByText(/Answers from Claude and OpenAI/)).toBeTruthy();
  expect(screen.getByText(/Up to 300 AI model answers a month/)).toBeTruthy();
  expect(screen.getByTestId("paywall-buy-monthly")).toHaveTextContent(/\$4\.99/);
  expect(screen.getByTestId("paywall-buy-yearly")).toHaveTextContent(/\$39\.99/);
});

it("unlocks only when the server says the purchase is real", async () => {
  (purchasePro as jest.Mock).mockResolvedValue(PRO);
  const screen = await renderScreen();
  await act(async () => {});

  await act(async () => {
    await fireEvent.press(screen.getByTestId("paywall-buy-yearly"));
  });

  expect(purchasePro).toHaveBeenCalledWith("yearly");
  expect(mockSetQueryData).toHaveBeenCalledWith(["account", "u1"], PRO);
  expect(navigation.goBack).toHaveBeenCalled();
});

it("says nothing when the user closes the store sheet", async () => {
  (purchasePro as jest.Mock).mockRejectedValue(new PurchaseCancelledError());
  const screen = await renderScreen();
  await act(async () => {});

  await act(async () => {
    await fireEvent.press(screen.getByTestId("paywall-buy-monthly"));
  });

  expect(alertSpy).not.toHaveBeenCalled();
  expect(navigation.goBack).not.toHaveBeenCalled();
});

it("restore reports honestly when the store holds no subscription", async () => {
  (restorePro as jest.Mock).mockResolvedValue(null);
  const screen = await renderScreen();
  await act(async () => {});

  await act(async () => {
    await fireEvent.press(screen.getByTestId("paywall-restore"));
  });

  expect(alertSpy.mock.calls[0][0]).toBe("Nothing to Restore");
});

it("can always be dismissed", async () => {
  const screen = await renderScreen();
  await act(async () => {});
  await fireEvent.press(screen.getByTestId("paywall-not-now"));
  expect(navigation.goBack).toHaveBeenCalled();
});

it("shows a subscriber their plan instead of selling it again", async () => {
  account(PRO);
  const screen = await renderScreen();
  await act(async () => {});

  expect(screen.getByTestId("paywall-active")).toBeTruthy();
  expect(screen.queryByTestId("paywall-buy-monthly")).toBeNull();
  expect(fetchProOffers).not.toHaveBeenCalled();
});

it("says plans are coming while the server has purchases switched off", async () => {
  account({ ...FREE, purchases_available: false });
  const screen = await renderScreen();
  await act(async () => {});

  expect(screen.getByTestId("paywall-coming-soon")).toBeTruthy();
  expect(fetchProOffers).not.toHaveBeenCalled();
});
