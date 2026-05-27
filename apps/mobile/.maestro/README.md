# Maestro E2E tests

Black-box end-to-end tests for the RDN mobile app.

## Why Maestro (not Detox)

- Single YAML file per flow — no JS test runtime to maintain
- Works against any build (Expo Go, EAS preview, prod)
- iOS + Android with the same flow file
- Built-in retry + flakiness mitigation
- CI-friendly (single binary, no native compile)

## Install (local)

```bash
brew tap mobile-dev-inc/tap
brew install maestro
```

Or one-liner:

```bash
curl -fsSL "https://get.maestro.mobile.dev" | bash
```

## Run

Against Expo Go pointing at UAT (per `.env`):

```bash
# iOS simulator
maestro test apps/mobile/.maestro/flows/

# Android emulator
maestro test apps/mobile/.maestro/flows/

# Single flow
maestro test apps/mobile/.maestro/flows/01-login.yaml
```

## CI integration (future)

```yaml
# .github/workflows/mobile-e2e.yml (not yet wired)
- uses: mobile-dev-inc/action-maestro-cloud@v1
  with:
    api-key: ${{ secrets.MAESTRO_CLOUD_API_KEY }}
    app-file: build/RDN.app
    flows: apps/mobile/.maestro/flows/
```

## Flow conventions

- File names prefixed with `NN-` for execution order
- Each flow self-contained (login at start if needed)
- Use `appId: com.rdn.mobile` in every flow
- Test creds: phone `+919999900001` / OTP `123456` (dev-bypass; matches UAT seed)

## Known gaps

- Owner property wizard flow (waiting on wizard port)
- Push notification tap-to-route (Maestro can't trigger pushes externally — manual)
- Account deletion (destructive — only run against ephemeral test users)
