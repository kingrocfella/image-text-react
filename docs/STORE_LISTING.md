# Store listing and review notes

Working copy for App Store Connect and the Play Console. Keep it true to the build being
submitted; anything marked **confirm** needs the owner before it is pasted into a store form.

## Identity

| | |
| --- | --- |
| Name | ScanGenAI |
| Bundle ID / package | `com.leonfrontier.scangenai` |
| Category | Productivity |
| Privacy policy | https://leonfrontier.com/scangenai/privacy |
| Terms of Use | https://leonfrontier.com/scangenai/terms |
| Support | https://leonfrontier.com/scangenai/support |
| Account deletion (web) | https://leonfrontier.com/scangenai/delete-account |

## Short description (80 characters)

Turn photos, voice and PDFs into text, and ask questions about your documents.

## Full description

ScanGenAI turns what you have into text you can use.

- **Photos to text.** Photograph a page, a sign or a whiteboard, or pick an image, and get the
  text back, ready to copy.
- **Voice to text.** Record in the app or choose an audio file and get a transcript.
- **Ask your PDFs.** Upload a PDF and ask questions about it in plain language. Follow-up
  questions keep the same document.

ScanGenAI is free within a monthly allowance, shown in the app. ScanGenAI Pro, an optional
auto-renewing subscription, adds the Claude and OpenAI models and higher limits. Terms of Use:
https://leonfrontier.com/scangenai/terms

## What reviewers need

- **Subscriptions.** ScanGenAI Pro (`scangenai_pro_monthly`, `scangenai_pro_yearly`) is sold on
  the upgrade screen: Account → Upgrade to Pro. It shows the store's price, Restore Purchases,
  and links to the Terms and Privacy Policy. Attach a screenshot of it to each product.
- **Sign in with Apple** is offered on iOS alongside email sign-in; Google sign-in on Android.
- **Sign-in.** The app requires an account. Create the review account on the server with
  `make seed-reviewer-account EMAIL=…` (`../image-to-text-app/docs/operations.md`) and give the
  same sign-in to both stores.
- **Account creation and deletion.** Register from the sign-in screen. Delete from
  **Account → Delete My Account** (asks for the password, then deletes the account, uploaded
  documents and everything derived from them at once). The web route above is the alternative
  Google Play asks for.
- **Permissions.** Camera (photographing text), microphone (recording audio to transcribe) and,
  on iOS, the photo library (choosing an image). Nothing is requested until the feature is used.
  The app does not request broad storage or media access on Android.

## Data safety / privacy answers

Declare what the app really collects. From the code:

| Data | Collected | Why | Notes |
| --- | --- | --- | --- |
| Name, email address | Yes | Account | Deleted with the account |
| Photos, audio, files the user uploads | Yes, processed | The feature | Images and audio are deleted when the job finishes; PDF text is kept as embeddings for 30 days, then deleted |
| Diagnostics | Yes | App functionality | Redacted before upload: no email, tokens, questions, file names or extracted text |
| Purchase history | Yes | App functionality | The store's transaction ID and expiry, to grant Pro; never card details |
| Location, contacts, advertising ID | No | | No ads, no analytics SDK, no tracking |

- Data is encrypted in transit (https only).
- Users can request deletion in the app and on the web.
- PDF questions send document text to OpenAI (embeddings) and to the model provider the user
  picks (Google Gemini, DeepSeek, Anthropic or OpenAI). The website privacy policy now names
  each; the stores' third-party sharing answers must match it.
- **Confirm** before submitting: Gemini runs on Google's free API tier, where Google may use
  submitted content to improve its products. The privacy policy says so. If that is not
  acceptable for the listing, enable billing on the Gemini key and update the policy.

## Export compliance

`ITSAppUsesNonExemptEncryption` is `false` in `app.json`: the app uses only the operating
system's standard https.

## Before submitting

- [ ] Screenshots match the submitted build (the **Account** tab is new in 1.1.0).
- [ ] The review account signs in on a production build.
- [ ] `STORE_URLS` in `src/constants` is filled in for the next release once this one is live.
- [ ] The privacy policy lists the model providers above.
