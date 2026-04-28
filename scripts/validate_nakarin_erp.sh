#!/usr/bin/env bash

set -u

fail_count=0
warn_count=0

pass() {
  printf 'PASS: %s\n' "$1"
}

fail() {
  printf 'FAIL: %s\n' "$1"
  fail_count=$((fail_count + 1))
}

warn() {
  printf 'WARN: %s\n' "$1"
  warn_count=$((warn_count + 1))
}

check_file_nonempty() {
  local path="$1"

  if [[ ! -e "$path" ]]; then
    fail "$path is missing"
    return
  fi

  if [[ ! -f "$path" ]]; then
    fail "$path exists but is not a regular file"
    return
  fi

  if [[ ! -s "$path" ]]; then
    fail "$path exists but is empty"
    return
  fi

  pass "$path exists and is non-empty"
}

check_dir_exists() {
  local path="$1"

  if [[ -d "$path" ]]; then
    pass "$path exists"
  else
    fail "$path is missing"
  fi
}

check_file_contains() {
  local path="$1"
  local pattern="$2"
  local description="$3"

  if [[ ! -f "$path" ]]; then
    fail "$path is missing"
    return
  fi

  if grep -Fq "$pattern" "$path"; then
    pass "$description"
  else
    fail "$path is missing required text: $pattern"
  fi
}

check_business_module() {
  local module="$1"
  local path="nakarin_erp/businesses/$module"

  if [[ -d "$path" ]]; then
    pass "business module $module exists"
  else
    fail "business module $module is missing"
  fi
}

check_all_nakarin_files_nonempty() {
  local found=0
  local empty_count=0
  local file

  while IFS= read -r file; do
    found=1
    if [[ ! -s "$file" ]]; then
      fail "$file is empty"
      empty_count=$((empty_count + 1))
    fi
  done < <(find nakarin_erp -type f | sort)

  if [[ $found -eq 0 ]]; then
    fail "nakarin_erp contains no files"
    return
  fi

  if [[ $empty_count -eq 0 ]]; then
    pass "all files under nakarin_erp are non-empty"
  fi
}

printf 'Nakarin ERP validation start\n'

check_file_nonempty "AGENTS.md"
check_file_nonempty "nakarin_erp/SOURCE_OF_TRUTH.md"
check_file_nonempty "nakarin_erp/AGENT_HANDOFF.md"
check_file_nonempty "nakarin_erp/NAKARIN_SKILL.md"
check_file_nonempty "nakarin_erp/README.md"

check_dir_exists "nakarin_erp/bmad_bridge"
check_file_nonempty "nakarin_erp/bmad_bridge/README.md"
check_file_nonempty "nakarin_erp/bmad_bridge/bmad_usage_policy.md"
check_file_nonempty "nakarin_erp/bmad_bridge/story_definition_of_done.md"
check_file_nonempty "nakarin_erp/bmad_bridge/prd_template_mapping.md"
check_file_nonempty "nakarin_erp/bmad_bridge/qa_gate_policy.md"

check_file_contains "tHe_DuDe_Service/_bmad/core/tasks/bmad-create-prd/templates/prd-template.md" "## Nakarin ERP References" "PRD template includes Nakarin ERP references section"
check_file_contains "tHe_DuDe_Service/_bmad/bmm/workflows/3-solutioning/bmad-create-architecture/architecture-decision-template.md" "## Nakarin ERP References" "Architecture template includes Nakarin ERP references section"
check_file_contains "tHe_DuDe_Service/_bmad/bmm/workflows/4-implementation/bmad-create-story/template.md" "### Nakarin ERP References" "Story template includes Nakarin ERP references section"
check_file_contains "tHe_DuDe_Service/_bmad/bmm/workflows/4-implementation/bmad-code-review/steps/step-04-present.md" "Nakarin ERP References" "Code review output rules enforce Nakarin ERP references"
check_file_contains "tHe_DuDe_Service/_bmad/bmm/workflows/2-plan-workflows/bmad-validate-prd/steps-v/step-v-06-traceability-validation.md" "Nakarin ERP References Validation" "PRD validation checks Nakarin ERP references"

check_dir_exists "nakarin_erp/businesses"
check_business_module "ice_fac_aran"
check_business_module "am_nexus"
check_business_module "121c"
check_business_module "room_service"
check_business_module "pos"

check_all_nakarin_files_nonempty

if [[ ! -x "scripts/validate_nakarin_erp.sh" ]]; then
  warn "scripts/validate_nakarin_erp.sh is not executable"
fi

printf 'Validation summary: %s fail, %s warn\n' "$fail_count" "$warn_count"

if [[ $fail_count -ne 0 ]]; then
  exit 1
fi

exit 0
