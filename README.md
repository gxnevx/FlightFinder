# ✈️ FlightFinder

FlightFinder is a flight-search agent. Its **main function** is finding flights —
prices, schedules, cabin comparisons, and booking links — powered by the
[`google-flights`](.claude/skills/google-flights/SKILL.md) skill from
[skillhq/flight-search](https://github.com/skillhq/flight-search), which drives
Google Flights via browser automation.

## Ask it things like

- "Find flights from JFK to LAX on July 20"
- "How much is a flight from Miami to San Francisco?"
- "Cheapest nonstop from BKK to NRT, March 20–27"
- "One-way business class from SFO to Tokyo, April 15"

## How it works

The `google-flights` skill issues [`agent-browser`](https://github.com/nicobailey/agent-browser)
commands to open Google Flights, read the results, and extract booking options.
The runtime is provisioned automatically on each session:

| Piece | Role |
|-------|------|
| `.claude/skills/google-flights/` | The installed skill (triggers + workflow). |
| `.claude/hooks/setup-agent-browser.sh` | SessionStart hook: installs the CLI and links a Chromium. |
| `.claude/settings.json` | Browser env vars + `agent-browser` permission. |
| `skills-lock.json` | Pins the installed skill version. |

> Tuned for **Claude Code on the web**. To run elsewhere, install the CLI
> (`npm i -g agent-browser && agent-browser install`) and drop the
> sandbox-specific env vars — see [CLAUDE.md](CLAUDE.md).

## Install / restore the skill

```bash
npx skills add https://github.com/skillhq/flight-search --skill google-flights
# or, from this repo's lockfile:
npx skills experimental_install
```
