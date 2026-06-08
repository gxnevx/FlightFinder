#!/usr/bin/env bash
# SessionStart hook — provisions FlightFinder's flight-search runtime:
#   1. google-flights engine  -> agent-browser CLI + a Chromium symlink
#   2. LetsFG engine          -> letsfg CLI (npm) + its Python backend (pip)
#   3. BRL converter          -> pre-build the dolarhoje Rust tool (background)
#
# The container is ephemeral, so everything is (re)provisioned each session.
# Best-effort by design: it never blocks a session (always exits 0).
set -u

log() { printf 'flightfinder/setup: %s\n' "$1" >&2; }

# --- Engine 1: google-flights (agent-browser + Chromium) ---------------------
if ! command -v agent-browser >/dev/null 2>&1; then
  log "installing agent-browser CLI (npm i -g agent-browser)..."
  npm install -g agent-browser >/dev/null 2>&1 \
    && log "agent-browser installed" \
    || log "WARN: could not install agent-browser (check the network policy)"
fi

# Prefer the sandbox's pre-installed Playwright Chromium (its own download is
# blocked by the TLS-intercepting proxy); fall back to the CLI's downloader.
CHROME=""
for c in "${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}"/chromium-*/chrome-linux/chrome; do
  if [ -x "$c" ]; then CHROME="$c"; break; fi
done
if [ -z "$CHROME" ] && command -v agent-browser >/dev/null 2>&1; then
  agent-browser install >/dev/null 2>&1 || true
  CHROME=$(find "$HOME/.agent-browser/browsers" "$HOME/.cache/ms-playwright" \
            -type f -name chrome 2>/dev/null | head -n1)
fi

STABLE="${AGENT_BROWSER_EXECUTABLE_PATH:-$HOME/.agent-browser/chrome}"
if [ -n "$CHROME" ]; then
  mkdir -p "$(dirname "$STABLE")"
  ln -sf "$CHROME" "$STABLE"
  log "Chromium ready: $STABLE -> $CHROME"
else
  log "WARN: no Chromium found; google-flights is offline until one is available"
fi

# Drop any stale daemon so the next command launches one with the env config.
if command -v agent-browser >/dev/null 2>&1; then
  agent-browser close --all >/dev/null 2>&1 || true
fi

# --- Engine 2: LetsFG (400+ airlines, search-only, no API key) ---------------
if ! command -v letsfg >/dev/null 2>&1; then
  log "installing LetsFG CLI (npm i -g letsfg)..."
  npm install -g letsfg >/dev/null 2>&1 \
    && log "LetsFG CLI installed" \
    || log "WARN: could not install letsfg (npm)"
fi
# The CLI and the letsfg-mcp server both delegate search to this Python backend.
if ! python3 -c "import letsfg" >/dev/null 2>&1; then
  log "installing LetsFG backend (pip install letsfg)..."
  pip3 install --quiet letsfg >/dev/null 2>&1 \
    && log "LetsFG backend installed" \
    || log "WARN: could not install letsfg (pip)"
fi

# --- Engine 3: fast-flights (segunda fonte estruturada, scraper sem browser) --
if ! python3 -c "import fast_flights" >/dev/null 2>&1; then
  log "installing fast-flights (pip)..."
  pip3 install --quiet fast-flights >/dev/null 2>&1 \
    && log "fast-flights installed" \
    || log "WARN: could not install fast-flights (pip)"
fi

# Câmbio: o conversor dolarhoje (Rust) é só fallback de último recurso (AwesomeAPI
# e Frankfurter cobrem o caso comum), então o ./bin/dolar compila sob demanda em
# vez de gastar build a cada sessão.

exit 0
