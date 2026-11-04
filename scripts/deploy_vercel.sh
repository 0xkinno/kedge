#!/usr/bin/env bash
# One command from the repo root: VERCEL_TOKEN=... bash scripts/deploy_vercel.sh [project-name]
# Needs: a Vercel token (vercel.com/account/tokens). Optional: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, TELEGRAM_BOT_TOKEN.
# House crew keys are read from the gitignored keys/ folder (testnet only) and sent to Vercel as encrypted env vars. Nothing is committed.
set -euo pipefail
: "${VERCEL_TOKEN:?set VERCEL_TOKEN}"
PROJECT="${1:-kedge}"; V="npx --yes vercel@65.11.0 --token $VERCEL_TOKEN"
API=https://api.vercel.com
node scripts/sync_web_data.mjs
# 1. project with Root Directory = apps/web (the app imports ../../watch, so source files outside the root must be included)
code=$(curl -s -o /tmp/vp.json -w '%{http_code}' -H "Authorization: Bearer $VERCEL_TOKEN" "$API/v9/projects/$PROJECT")
if [ "$code" != "200" ]; then curl -sf -X POST -H "Authorization: Bearer $VERCEL_TOKEN" -H 'content-type: application/json' "$API/v11/projects" \
  -d "{\"name\":\"$PROJECT\",\"framework\":\"nextjs\",\"rootDirectory\":\"apps/web\",\"installCommand\":\"npm ci\",\"buildCommand\":\"next build\",\"nodeVersion\":\"22.x\"}" > /tmp/vp.json; fi
PID=$(node -pe "JSON.parse(require('fs').readFileSync('/tmp/vp.json','utf8')).id")
curl -sf -X PATCH -H "Authorization: Bearer $VERCEL_TOKEN" -H 'content-type: application/json' "$API/v9/projects/$PROJECT" \
  -d '{"rootDirectory":"apps/web","framework":"nextjs","installCommand":"npm ci","buildCommand":"next build","sourceFilesOutsideRootDirectory":true}' > /dev/null
# 2. environment variables (production)
setenv() { local k="$1" v="$2" t="${3:-encrypted}"; curl -sf -X POST -H "Authorization: Bearer $VERCEL_TOKEN" -H 'content-type: application/json' "$API/v10/projects/$PID/env?upsert=true" \
  -d "$(node -pe "JSON.stringify({key:'$k',value:process.argv[1],type:'$t',target:['production','preview']})" "$v")" > /dev/null && echo "env $k set"; }
setenv DRILL_RAMON_PK    "$(node -pe "require('./keys/drill-ramon.json').privateKey")"
setenv DRILL_LORNA_PK    "$(node -pe "require('./keys/drill-lorna.json').privateKey")"
setenv DRILL_BEN_PK      "$(node -pe "require('./keys/drill-ben.json').privateKey")"
setenv DRILL_LIFEBOAT_PK "$(node -pe "require('./keys/drill-lifeboat.json').privateKey")"
setenv DRILL_KILL 0 plain
setenv NEXT_PUBLIC_SUBSTRATE_WS wss://test-node-v3.portaldot.dev plain
setenv NEXT_PUBLIC_EVM_RPC https://test-evm-rpc-v3.portaldot.dev plain
setenv NEXT_PUBLIC_VAULT_ADDRESS "$(node -pe "require('./deployments/testnet.json').AllotmentVault.address")" plain
[ -n "${UPSTASH_REDIS_REST_URL:-}" ] && setenv UPSTASH_REDIS_REST_URL "$UPSTASH_REDIS_REST_URL" && setenv UPSTASH_REDIS_REST_TOKEN "${UPSTASH_REDIS_REST_TOKEN:?}"
[ -n "${TELEGRAM_BOT_TOKEN:-}" ] && setenv TELEGRAM_BOT_TOKEN "$TELEGRAM_BOT_TOKEN"
# 3. deploy to production
URL=$($V deploy --prod --yes --cwd . --scope "${VERCEL_SCOPE:-}" 2>/dev/null | tail -1 || true)
[ -z "$URL" ] && URL=$($V deploy --prod --yes | tail -1)
echo "DEPLOYED $URL"; echo "$URL" > docs/DEPLOYED_URL.txt
# 4. test the deployed link
BASE="$URL" node scripts/reachability.mjs
BASE="$URL" OUT=docs/demo/deployed-run node e2e/wallet.mjs
