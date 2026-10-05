/**
 * app.json cannot import src/constants, so the values they share are checked
 * here. Also guards the rules a reviewer would otherwise have to remember.
 */
import appJson from "../../app.json";
import easJson from "../../eas.json";
import packageJson from "../../package.json";
import { API_PREFIX, API_ROUTES } from "../api/routes.generated";
import {
  API_BASE_URL,
  APP_NAME,
  APP_VERSION,
  EAS_PROJECT_ID,
  GOOGLE_SIGN_IN_ENABLED,
  GOOGLE_WEB_CLIENT_ID,
  IAP,
  LEGAL_URLS,
  PASSWORD_MIN_LENGTH,
} from "../constants";
import { getPasswordError, getLoginPasswordError } from "../utils/validation";
import { tooLargeMessage } from "../utils/uploadLimits";
import { modelLabel, proBenefits } from "../utils/plan";

const app = appJson.expo;

describe("native config matches src/constants", () => {
  it("name, version and EAS project", () => {
    expect(app.name).toBe(APP_NAME);
    expect(app.version).toBe(APP_VERSION);
    expect(packageJson.version).toBe(APP_VERSION);
    expect(app.extra).toEqual({ eas: { projectId: EAS_PROJECT_ID } });
  });

  it("OTA updates come from this EAS project, to builds of the same version", () => {
    expect(app.updates.url).toBe(`https://u.expo.dev/${EAS_PROJECT_ID}`);
    expect(app.runtimeVersion).toEqual({ policy: "appVersion" });
    expect(easJson.build.production.channel).toBe("production");
    expect(easJson.build.preview.channel).toBe("preview");
  });

  it("requests only the Android permissions the app uses", () => {
    expect(app.android.permissions).toEqual([
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO",
    ]);
    // Broad media access is what Play flags; the system pickers need none.
    expect(app.android.blockedPermissions).toEqual(
      expect.arrayContaining([
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.READ_MEDIA_VIDEO",
        "android.permission.READ_MEDIA_AUDIO",
      ]),
    );
  });

  it("explains every iOS permission it asks for", () => {
    for (const key of [
      "NSCameraUsageDescription",
      "NSPhotoLibraryUsageDescription",
      "NSMicrophoneUsageDescription",
    ]) {
      expect((app.ios.infoPlist as Record<string, unknown>)[key]).toMatch(
        /ScanGenAI/,
      );
    }
  });
});

describe("sign-in and purchases", () => {
  it("iOS is entitled to Sign in with Apple", () => {
    expect(app.ios.usesAppleSignIn).toBe(true);
    expect(app.plugins).toContain("expo-apple-authentication");
  });

  it("product IDs carry the app prefix the developer team requires", () => {
    expect(IAP.proMonthlyProductId).toBe("scangenai_pro_monthly");
    expect(IAP.proYearlyProductId).toBe("scangenai_pro_yearly");
    expect(IAP.androidPackageName).toBe(app.android.package);
  });

  it("Google sign-in is offered only once a client ID is configured", () => {
    expect(GOOGLE_SIGN_IN_ENABLED).toBe(GOOGLE_WEB_CLIENT_ID.length > 0);
  });

  it("names models and Pro benefits from the server\'s answer", () => {
    expect(modelLabel("deepseek")).toBe("DeepSeek");
    expect(
      proBenefits({
        pro: false,
        pro_models: ["claude", "openai"],
        pro_limits: { cloud_model: 300, pdf: 500 },
      } as never),
    ).toEqual([
      "Answers from Claude and OpenAI",
      "Up to 300 AI model answers a month",
      "Up to 500 PDF questions a month",
    ]);
  });
});

describe("public configuration", () => {
  it("talks to the API over https only", () => {
    expect(API_BASE_URL).toMatch(/^https:\/\/[^/]+$/);
    for (const url of Object.values(LEGAL_URLS)) expect(url).toMatch(/^https:\/\//);
  });

  it("every API route is under the versioned prefix", () => {
    for (const route of Object.values(API_ROUTES)) {
      const path = typeof route === "function" ? route("x") : route;
      expect(path.startsWith(`${API_PREFIX}/`)).toBe(true);
    }
  });
});

describe("validation mirrors the server", () => {
  it("requires the server\'s minimum length for a new password", () => {
    expect(getPasswordError("a".repeat(PASSWORD_MIN_LENGTH - 1))).toMatch(/at least 8/);
    expect(getPasswordError("a".repeat(PASSWORD_MIN_LENGTH))).toBeNull();
    // 72 bytes, not 72 characters: these 25 characters are 75 bytes.
    expect(getPasswordError("€".repeat(25))).toBe("Password is too long");
  });

  it("does not second-guess an existing password at sign-in", () => {
    expect(getLoginPasswordError("short")).toBeNull();
    expect(getLoginPasswordError("")).toBe("Password is required");
  });

  it("warns before an upload the server would refuse", () => {
    expect(tooLargeMessage("pdfBytes", 21 * 1024 * 1024)).toMatch(/21 MB.*20 MB/);
    expect(tooLargeMessage("pdfBytes", 5 * 1024 * 1024)).toBeNull();
    expect(tooLargeMessage("imageBytes", undefined)).toBeNull();
  });
});
