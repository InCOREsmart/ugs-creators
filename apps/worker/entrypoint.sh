#!/bin/sh
set -eu

# Do not process uploaded files with an empty or missing malware database.
if ! find /var/lib/clamav -maxdepth 1 -type f \( -name '*.cvd' -o -name '*.cld' \) -print -quit | grep -q .; then
  freshclam
else
  freshclam || echo "WARNING: ClamAV database refresh failed; using existing database" >&2
fi

exec su-exec worker pnpm --filter @ugs/worker start
