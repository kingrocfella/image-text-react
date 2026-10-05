# Releasing ScanGenAI

Two ways to ship a change:

- **`eas update`** — an over-the-air JavaScript bundle. Reaches installed builds in about half a
  minute; nothing to reinstall.
- **`eas build`** — a new binary. Needed for anything native.

## Before either

```bash
npm run check                               # typecheck, lint, guards, tests, audit
make -C ../image-to-text-app check-routes   # the route mirror matches the server
npx expo-doctor                             # 21/21
```

`npm run check` ends with a strict `npm audit --omit=dev`. See "The audit" below.

## How over-the-air updates are wired

`app.json` points `updates.url` at this app's EAS project and sets
`runtimeVersion: { "policy": "appVersion" }`. The app checks for an update at launch without
waiting for it and applies a downloaded one on the **next** cold start. Each `eas.json` build
profile has a channel of the same name (`development`, `preview`, `production`).

- **No build made before version 1.1.0 can receive updates.** Earlier builds had no update URL.
- **An update only reaches builds with the same `expo.version`.** So any native change — a new
  native package, a config plugin, an `android.*` / `ios.*` field, an Expo SDK bump — needs a
  version bump *and* a new build. Otherwise `eas update` ships JavaScript that calls native code
  the installed binary does not have, and it crashes.

The version lives in three places that must agree: `app.json` `expo.version`, `package.json`
`version` and `APP_VERSION` in `src/constants`. `src/__tests__/constants.test.ts` fails if they
differ.

## JS-only change

```bash
eas update --branch preview --message "fix: usage card wording"
eas update --branch production --message "fix: usage card wording"
eas update:list --branch production
eas update:republish --branch production --group <group-id>    # roll back
```

## Native change

```bash
# 1. Bump the version in app.json, package.json and src/constants (same value).
# 2. npm run check
eas build --platform android --profile preview       # sideloadable APK
eas build --platform all --profile production        # store builds
eas submit --platform all --profile production
```

Build numbers increment automatically (`autoIncrement`, `appVersionSource: remote`).

## When the server's API changes

1. Change `app/paths.py` in `../image-to-text-app`, then `make generate-routes` there. Commit
   `src/api/routes.generated.ts` here.
2. If old builds cannot work with the new API, ship the new build, wait until it is live in both
   stores, and only then raise `MINIMUM_APP_VERSION` on the server
   (`../image-to-text-app/docs/operations.md`). Older builds then show "Update required".
3. Add the store URLs to `STORE_URLS` in `src/constants` once the app is published, so that prompt
   gets an Update button.

## The audit

`npm run audit:prod` currently reports high-severity findings from two advisories, both in
Expo's build tooling rather than in code that runs on a phone: `node-forge`
(GHSA-86w9-cpqp-85rv, no patched release exists) and `braces` (GHSA-vfj7-8cjw-p6xm). npm's
suggested fix downgrades Expo out of SDK 57. Do not `npm audit fix --force`, and do not pin a
fork or an unreleased branch to make the number go away. When a fixed release exists, add an
`overrides` entry, reinstall, and re-run `npm run check` and `npx expo-doctor`. The same finding
is open on NoAlibi (`../../noalibi/memory.md`).
