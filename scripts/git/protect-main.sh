#!/usr/bin/env bash
# Rejects pushes that target main directly (15-git-ve-ci §2). Reads git's pre-push stdin:
# <local ref> <local sha> <remote ref> <remote sha>, one line per ref being pushed.
set -euo pipefail

while read -r _local_ref _local_sha remote_ref _remote_sha; do
  if [[ "$remote_ref" == "refs/heads/main" ]]; then
    echo "✖ main dalına doğrudan push yapılamaz. Bir dal açın ve PR ile birleştirin." >&2
    exit 1
  fi
done

exit 0
