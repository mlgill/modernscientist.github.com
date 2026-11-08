#!/bin/bash
set -euo pipefail
tests_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
npm --prefix "$tests_directory" ci --ignore-scripts
PLAYWRIGHT_BROWSERS_PATH=0 npm --prefix "$tests_directory" exec -- playwright install chromium
