#!/usr/bin/env bash
# SessionStart hook — prepares the agent-browser runtime that powers
# FlightFinder's main function: the `google-flights` skill.
#
# The execution container is ephemeral, so the CLI and the browser symlink
# are (re)created on every session start. Best-effort by design: it never
# blocks a session (always exits 0) and only logs what it did.
set -u

log() { printf 'flightfinder/setup: %s\n' "$1" >&2; }

# 1. Ensure the agent-browser CLI is on PATH (reinstalled each fresh container).
if ! command -v agent-browser >/dev/null 2>&1; then
  log "installing agent-browser CLI (npm i -g agent-browser)..."
  if npm install -g agent-browser >/dev/null 2>&1; then
    log "agent-browser installed"
  else
    log "WARN: could not install agent-browser (check the network policy)"
  fi
fi

# 2. Locate a Chromium the CLI can drive.
#    The web sandbox ships a Playwright Chromium, and agent-browser's own
#    downloader is blocked by the TLS-intercepting proxy, so prefer that one.
CHROME=""
for c in "${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}"/chromium-*/chrome-linux/chrome; do
  if [ -x "$c" ]; then CHROME="$c"; break; fi
done

# Fallback (e.g. running locally off-proxy): let the CLI download its own.
if [ -z "$CHROME" ] && command -v agent-browser >/dev/null 2>&1; then
  agent-browser install >/dev/null 2>&1 || true
  CHROME=$(find "$HOME/.agent-browser/browsers" "$HOME/.cache/ms-playwright" \
            -type f -name chrome 2>/dev/null | head -n1)
fi

# 3. Publish it at the stable path that .claude/settings.json points at, so the
#    skill's plain `agent-browser` commands resolve the browser via env vars.
STABLE="${AGENT_BROWSER_EXECUTABLE_PATH:-$HOME/.agent-browser/chrome}"
if [ -n "$CHROME" ]; then
  mkdir -p "$(dirname "$STABLE")"
  ln -sf "$CHROME" "$STABLE"
  log "Chromium ready: $STABLE -> $CHROME"
else
  log "WARN: no Chromium found; flight search is offline until one is available"
fi

# 4. Drop any stale daemon so the next command launches one that picks up the
#    env config above (avoids "--ignore-https-errors ignored: daemon already
#    running"). Browser state for flight search is disposable, so this is safe.
if command -v agent-browser >/dev/null 2>&1; then
  agent-browser close --all >/dev/null 2>&1 || true
fi

exit 0
