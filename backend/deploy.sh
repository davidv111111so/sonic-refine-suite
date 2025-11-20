#!/bin/bash

# Script de deployment para Google Cloud Run
# Uso: ./deploy.sh [SERVICE_NAME] [REGION]

set -e  # Salir si hay algún error

# Configuración
PROJECT_ID="total-acumen-473702-j1"
SERVICE_NAME="${1:-audio-mastering-api}"
REGION="${2:-us-central1}"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "=========================================="
echo "🚀 Desplegando Audio Mastering API"
echo "=========================================="
echo "Project ID: ${PROJECT_ID}"
echo "Service Name: ${SERVICE_NAME}"
echo "Region: ${REGION}"
echo "Image: ${IMAGE_NAME}"
echo "=========================================="

# Verificar que gcloud está instalado
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI no está instalado"
    echo "Instala desde: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Verificar que docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker no está instalado"
    exit 1
fi

# Configurar proyecto
echo "📋 Configurando proyecto..."
gcloud config set project ${PROJECT_ID}

# Habilitar APIs necesarias
echo "🔧 Habilitando APIs necesarias..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Construir imagen Docker
echo "🔨 Construyendo imagen Docker..."
docker build -t ${IMAGE_NAME} .

# Autenticar Docker con gcloud
echo "🔐 Autenticando Docker..."
gcloud auth configure-docker

# Subir imagen a Google Container Registry
echo "📤 Subiendo imagen a GCR..."
docker push ${IMAGE_NAME}

# Desplegar a Cloud Run
echo "🚀 Desplegando a Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 900 \
    --max-instances 10 \
    --set-env-vars "PROJECT_ID=${PROJECT_ID}" \
    --set-env-vars "BUCKET_NAME=spectrum-mastering-files-857351913435"

# Obtener URL del servicio
echo "📡 Obteniendo URL del servicio..."
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo ""
echo "=========================================="
echo "✅ Deployment completado exitosamente!"
echo "=========================================="
echo "Service URL: ${SERVICE_URL}"
echo "API Endpoint: ${SERVICE_URL}/api/master-audio"
echo ""
echo "⚠️  IMPORTANTE: Configura la variable de entorno:"
echo "   GOOGLE_APPLICATION_CREDENTIALS_JSON"
echo "   en Cloud Run con el JSON de credenciales"
echo ""
echo "Para actualizar la variable de entorno:"
echo "gcloud run services update ${SERVICE_NAME} \\"
echo "  --region ${REGION} \\"
echo "  --update-env-vars GOOGLE_APPLICATION_CREDENTIALS_JSON='<JSON_CONTENT>'"
echo "=========================================="














