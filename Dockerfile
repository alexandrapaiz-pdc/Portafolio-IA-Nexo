# Portafolio IA Nexo para Azure Container Apps: la página (React) y su API en un solo contenedor.
# Se construye desde la raíz del repositorio:
#   az acr build --registry <registro> --image nexo-portafolio-ia:<commit> .
# Pasos completos de despliegue: guía privada en BestPracticesAI (nivel 2.5).

# 1) La página, compilada en modo Azure (usa la API de la app en lugar del artifact)
FROM public.ecr.aws/docker/library/node:22-slim AS pagina
WORKDIR /web
COPY app/package.json app/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY app/ ./
RUN npm run build:nexo

# 2) La API (FastAPI) que también entrega la página
FROM public.ecr.aws/docker/library/python:3.12-slim
RUN useradd --create-home --uid 10001 api
WORKDIR /srv
COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY api/app ./app
COPY api/migraciones ./migraciones
COPY --from=pagina /web/dist/index.html ./static/index.html
ENV PAGINA=/srv/static/index.html MIGRACIONES=/srv/migraciones PYTHONUNBUFFERED=1
ARG BUILD_SHA=local
ARG BUILD_TIME=
ENV NEXO_BUILD_SHA=$BUILD_SHA NEXO_BUILD_TIME=$BUILD_TIME
LABEL org.opencontainers.image.revision=$BUILD_SHA
USER api
EXPOSE 8000
HEALTHCHECK CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/salud')"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
