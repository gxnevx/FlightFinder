# CLAUDE.md

## What FlightFinder is

FlightFinder's **main function is flight search**. It is powered by the
[`google-flights`](.claude/skills/google-flights/SKILL.md) skill (installed from
[skillhq/flight-search](https://github.com/skillhq/flight-search)), which drives
Google Flights through browser automation to return live prices, schedules,
cabin comparisons, and booking links.

When a request is about flights — finding routes, comparing fares/cabins,
checking schedules or availability, "how much is a flight from X to Y", cheapest
dates, nonstop options — **use the `google-flights` skill**. It is the primary
capability of this repository; treat it as the default tool for any flight task.

Out of scope (the skill says so too): completing purchases, hotels/cars, and
historical price analysis.

## How it runs

The skill issues `agent-browser` commands. The runtime is wired up
automatically so those commands "just work":

- **`.claude/hooks/setup-agent-browser.sh`** runs on every SessionStart. It
  installs the `agent-browser` CLI (the container is ephemeral) and points it at
  a Chromium binary via a stable symlink (`~/.agent-browser/chrome`).
- **`.claude/settings.json`** sets the environment the CLI needs:
  - `AGENT_BROWSER_EXECUTABLE_PATH` → the Chromium symlink the hook maintains.
  - `AGENT_BROWSER_IGNORE_HTTPS_ERRORS=true` → the web sandbox proxies TLS with a
    CA that Chromium doesn't trust; without this, navigation fails with
    `ERR_CERT_AUTHORITY_INVALID`.
  - `AGENT_BROWSER_ARGS=--no-sandbox` → required because the container runs as
    root.

These settings are tuned for **Claude Code on the web** (Node, root, the
pre-installed Playwright Chromium at `/opt/pw-browsers`, and a TLS-intercepting
proxy). Running elsewhere? `agent-browser install` downloads its own Chrome and
you can drop the sandbox-specific env vars.

## Quick smoke test

```bash
agent-browser --session test open "https://www.google.com/travel/flights?q=Flights+from+JFK+to+LAX+on+2026-07-20+one+way" \
  && agent-browser --session test wait --load networkidle \
  && agent-browser --session test snapshot -i \
  && agent-browser --session test close
```

## Troubleshooting

- **`Chrome not found`** → the SessionStart hook didn't find/symlink a browser.
  Re-run `bash .claude/hooks/setup-agent-browser.sh`.
- **`--ignore-https-errors ignored: daemon already running`** with cert/nav
  errors → a stale daemon launched without the right config. Run
  `agent-browser close --all`, then retry.
- **`ERR_CERT_AUTHORITY_INVALID`** → `AGENT_BROWSER_IGNORE_HTTPS_ERRORS` isn't
  reaching the CLI; confirm `.claude/settings.json` is loaded.

## Updating the skill

```bash
npx skills update google-flights        # bump to the latest upstream version
npx skills experimental_install         # restore from skills-lock.json
```
