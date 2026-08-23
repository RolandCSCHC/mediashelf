#!/usr/bin/env bash
# Upload library JSON backups to Dropbox, preserving {email}/filename.json.
# Requires: curl, jq, and DROPBOX_APP_KEY / DROPBOX_APP_SECRET / DROPBOX_REFRESH_TOKEN.
set -euo pipefail

SOURCE_DIR="${1:-}"
DROPBOX_FOLDER="${DROPBOX_FOLDER:-/Movies & Series/MediaShelf jsons}"

if [[ -z "$SOURCE_DIR" || ! -d "$SOURCE_DIR" ]]; then
  echo "Usage: $0 <directory-of-json-backups>" >&2
  exit 1
fi

SOURCE_DIR="$(cd "$SOURCE_DIR" && pwd)"

for var in DROPBOX_APP_KEY DROPBOX_APP_SECRET DROPBOX_REFRESH_TOKEN; do
  if [[ -z "${!var:-}" ]]; then
    echo "Missing required environment variable: $var" >&2
    exit 1
  fi
done

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to build Dropbox API requests." >&2
  exit 1
fi

token_body="$(
  curl -sS https://api.dropboxapi.com/oauth2/token \
    -d grant_type=refresh_token \
    -d refresh_token="$DROPBOX_REFRESH_TOKEN" \
    -d client_id="$DROPBOX_APP_KEY" \
    -d client_secret="$DROPBOX_APP_SECRET"
)"

access_token="$(jq -r '.access_token // empty' <<<"$token_body")"
if [[ -z "$access_token" ]]; then
  echo "Failed to refresh Dropbox access token:" >&2
  jq -r '.error_description // .error // .' <<<"$token_body" >&2
  exit 1
fi

ensure_folder() {
  local path="$1"
  local response http_code

  response="$(mktemp)"
  http_code="$(
    curl -sS -o "$response" -w "%{http_code}" \
      https://api.dropboxapi.com/2/files/create_folder_v2 \
      -H "Authorization: Bearer $access_token" \
      -H "Content-Type: application/json" \
      --data "$(jq -cn --arg path "$path" '{path: $path, autorename: false}')"
  )"

  if [[ "$http_code" == "200" ]]; then
    echo "Created Dropbox folder: $path"
    rm -f "$response"
    return 0
  fi

  if jq -e '.error_summary | test("conflict")' "$response" >/dev/null 2>&1; then
    echo "Dropbox folder already exists: $path"
    rm -f "$response"
    return 0
  fi

  echo "Failed to create Dropbox folder $path (HTTP $http_code):" >&2
  cat "$response" >&2
  rm -f "$response"
  return 1
}

ensure_folder_tree() {
  local path="$1"
  local current=""
  local part
  IFS=/ read -r -a parts <<<"${path#/}"
  for part in "${parts[@]}"; do
    [[ -z "$part" ]] && continue
    current="${current}/${part}"
    ensure_folder "$current"
  done
}

upload_file() {
  local local_path="$1"
  local relative="${local_path#"$SOURCE_DIR"/}"
  local dropbox_path="${DROPBOX_FOLDER%/}/${relative}"
  local dropbox_dir
  dropbox_dir="$(dirname "$dropbox_path")"
  local api_arg response http_code

  ensure_folder_tree "$dropbox_dir"

  api_arg="$(
    jq -cn \
      --arg path "$dropbox_path" \
      '{path: $path, mode: "overwrite", autorename: false, mute: true}'
  )"

  response="$(mktemp)"
  http_code="$(
    curl -sS -o "$response" -w "%{http_code}" \
      https://content.dropboxapi.com/2/files/upload \
      -H "Authorization: Bearer $access_token" \
      -H "Content-Type: application/octet-stream" \
      -H "Dropbox-API-Arg: $api_arg" \
      --data-binary @"$local_path"
  )"

  if [[ "$http_code" != "200" ]]; then
    echo "Failed to upload $relative to $dropbox_path (HTTP $http_code):" >&2
    cat "$response" >&2
    rm -f "$response"
    return 1
  fi

  echo "Uploaded $relative → $dropbox_path"
  rm -f "$response"
}

file_count=0
while IFS= read -r -d '' file; do
  file_count=$((file_count + 1))
  upload_file "$file"
done < <(find "$SOURCE_DIR" -type f -name '*.json' -print0)

if [[ "$file_count" -eq 0 ]]; then
  echo "No JSON files found in $SOURCE_DIR" >&2
  exit 1
fi
