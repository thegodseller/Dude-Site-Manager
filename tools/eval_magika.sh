#!/usr/bin/env bash

set -euo pipefail

pass() {
  printf 'PASS: %s\n' "$1"
}

fail() {
  printf 'FAIL: %s\n' "$1"
}

if ! command -v magika >/dev/null 2>&1; then
  fail "magika is not installed"
  echo "Run ./tools/install_magika.sh first"
  exit 1
fi

tmp_dir="$(mktemp -d /tmp/magika_eval.XXXXXX)"
trap 'rm -rf "$tmp_dir"' EXIT

sample_txt="$tmp_dir/sample.txt"
printf 'DuDe Magika evaluation sample\n' >"$sample_txt"

files=("$sample_txt")
if [[ -f README.md ]]; then
  files+=("README.md")
fi

pass "temporary evaluation directory created at $tmp_dir"
pass "running magika --json on ${#files[@]} file(s)"

if magika --json "${files[@]}"; then
  pass "magika evaluation completed"
else
  fail "magika evaluation failed"
  exit 1
fi
