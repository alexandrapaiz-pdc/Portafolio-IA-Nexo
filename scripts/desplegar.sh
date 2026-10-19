#!/usr/bin/env bash
# Despliegue directo, sin GitHub Actions: lo que Claude corre cuando se pide "deploy".
# Mismos pasos y controles que .github/workflows/desplegar.yml:
#   pruebas → imagen construida en Azure (ACR, sin Docker local) → solo cambia la imagen
#   → espera revisión sana → verifica que Entra y la configuración protegida no cambiaron.
#
# Requiere en el entorno (nunca en el repo):
#   AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET   service principal limitado a esta app y al ACR
#   AZURE_SUBSCRIPTION_ID                                   suscripción NEXO
# y acceso de red a management.azure.com, login.microsoftonline.com y crnexoaipdc01.azurecr.io.
set -euo pipefail
cd "$(dirname "$0")/.."

export RESOURCE_GROUP=rg-nexo-ai-core APP_NAME=nexo-portafolio-ia ACR_NAME=crnexoaipdc01
URL=https://nexo-portafolio-ia.wittysea-7e111699.eastus.azurecontainerapps.io
: "${AZURE_CLIENT_ID:?falta AZURE_CLIENT_ID}" "${AZURE_TENANT_ID:?falta AZURE_TENANT_ID}" "${AZURE_CLIENT_SECRET:?falta AZURE_CLIENT_SECRET}" "${AZURE_SUBSCRIPTION_ID:?falta AZURE_SUBSCRIPTION_ID}"

git diff --quiet && git diff --cached --quiet || { echo "Hay cambios sin commit: despliega solo código que está en GitHub." >&2; exit 1; }
SHA=$(git rev-parse HEAD)
git fetch -q origin main && [ "$(git rev-parse origin/main)" = "$SHA" ] || { echo "HEAD no es origin/main: haz push a main antes de desplegar." >&2; exit 1; }

echo "1/4 Pruebas"
(cd app && npm ci --no-audit --no-fund >/dev/null && npm run build:nexo >/dev/null)
python3 -m pytest -q .github/scripts

echo "2/4 Imagen en Azure Container Registry ($SHA)"
az login --service-principal -u "$AZURE_CLIENT_ID" -p "$AZURE_CLIENT_SECRET" --tenant "$AZURE_TENANT_ID" --only-show-errors >/dev/null
az account set --subscription "$AZURE_SUBSCRIPTION_ID"
az acr build --registry "$ACR_NAME" --image "$APP_NAME:$SHA" \
  --build-arg BUILD_SHA="$SHA" --build-arg BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)" --only-show-errors . >/dev/null
DIGEST=$(az acr repository show --name "$ACR_NAME" --image "$APP_NAME:$SHA" --query digest -o tsv)

echo "3/4 Nueva revisión y espera a que esté sana"
DEPLOY_IMAGE="$ACR_NAME.azurecr.io/$APP_NAME@$DIGEST" DEPLOY_SUFFIX="cl$(date -u +%m%d%H%M)" \
DEPLOY_COMMIT="$SHA" DEPLOY_SOURCE="claude" python3 .github/scripts/deploy_portal.py

echo "4/4 La API sigue protegida por Entra"
code=$(curl --silent --max-time 30 --output /dev/null --write-out '%{http_code}' "$URL/api/version")
[ "$code" = 401 ] || [ "$code" = 403 ] || [ "$code" = 302 ] || { echo "Respuesta anónima inesperada: $code" >&2; exit 1; }
echo "Publicado: $SHA → $URL"
