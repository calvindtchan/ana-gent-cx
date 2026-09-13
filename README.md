# ANA local search discovery starter

Milestone 1: validate ANA access in a dedicated local Chrome session and save user-selected result screenshots. This is **not yet an automated award search engine**. No live availability, mileage pricing, or ANA automation permission has been established by this project.

## macOS setup

Install Google Chrome and Node.js 22 or newer (https://nodejs.org/en/download), then run:

```sh
git clone https://github.com/calvindtchan/ana-gent-cx.git
cd ana-gent-cx
npm install
npm run check
npm start
```

If macOS asks to install Command Line Tools when running git, complete that installation first. Playwright uses installed Chrome; no separate browser download is required.

1. A dedicated Chrome window opens ANA's public award page.
2. Follow the award reservation link and sign in **in Chrome**. Complete any verification yourself. Do not save passwords in this dedicated profile.
3. Enter your desired route, dates, cabin and adult/child counts and run one search manually.
4. Return to Terminal, type `capture`, choose the correct ANA tab and confirm. A screenshot and timestamp are saved beneath `.local/captures/`. Input fields are masked, but other personal details may remain visible. Review and redact before sharing.
5. Type `quit` or press Ctrl+C to close this dedicated browser. Closing its window also ends the session.

The profile is stored under `.local/chrome-profile/`, separate from your everyday Chrome profile. It can retain session cookies. `.local/` is ignored by git; never force-add it or upload it. Delete `.local/chrome-profile/` in Finder while the assistant is stopped to discard this local profile. Captures remain unless separately deleted.

## What works and what remains

Implemented: local browser launch, manual login/search, tab selection, explicit local screenshot capture, password-page capture guard, timestamped unverified observations, and graceful shutdown.

Not implemented: automatic form filling, date sweeps, availability parsing, itinerary ranking, monitoring, alerts or booking. Screenshots are evidence for developing these features, not verified inventory. A failed or timed-out operation is never recorded as no availability.

If ANA shows a security challenge, access restriction or repeated login error, stop the automated workflow. Do not change fingerprints or proxies to bypass it. This starter has no stealth or retry loop. Successful manual access does not establish permission for unattended automation.

## Next milestones

1. Validate manual login and a four-passenger search on macOS; document form labels and result states using redacted evidence.
2. Review ANA's applicable terms and current award rules before automated queries. Verify child mileage treatment, seasonality, partner versus ANA awards, routing and fees from official sources.
3. Implement one bounded search with deterministic selectors, explicit login/error/waitlist states, and comparison against manual results.
4. Add a private trip configuration: date bounds, latest return arrival, trip-length preferences, airports, travellers, cabins, mileage budget and cash preferences. Keep personal trip details out of this public repo.
5. Normalize full itineraries with cabin per segment, passenger count, total miles/cash, observation time and source. Reject incomplete or merely inferred bookability.
6. Add a local date-grid comparison UI. Consider scheduling only after reliable access and permitted query frequency are established. Keep issuance under explicit user control.

## Technical references

- https://playwright.dev/docs/browsers
- https://playwright.dev/docs/api/class-browsertype#browser-type-launch-persistent-context
- https://www.ana.co.jp/en/gb/amc/international-flight-awards/

Type checking can be run with `npm run check`. End-to-end ANA access must be validated locally on the user's Mac; the earlier cloud-browser attempts did not establish successful authentication.
