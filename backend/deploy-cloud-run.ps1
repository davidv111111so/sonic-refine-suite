# PowerShell Script for deploying backend to Google Cloud Run
# Usage: .\deploy-cloud-run.ps1

$ErrorActionPreference = "Stop"

# Configuration
$PROJECT_ID = "total-acumen-473702-j1"
$SERVICE_NAME = "mastering-backend"
$REGION = "us-central1"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"
$BUCKET_NAME = "level-audio-mastering"

Write-Host "=========================================="
Write-Host "🚀 Deploying Real Matchering Backend"
Write-Host "=========================================="
Write-Host "Project ID: $PROJECT_ID"
Write-Host "Service Name: $SERVICE_NAME"
Write-Host "Region: $REGION"
Write-Host "Image: $IMAGE_NAME"
Write-Host "=========================================="
Write-Host ""

# Check gcloud is installed
try {
    $gcloudVersion = gcloud version 2>$null
    if (-not $gcloudVersion) {
        throw "gcloud not found"
    }
} catch {
    Write-Host "❌ Error: gcloud CLI is not installed"
    Write-Host "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
}

# Check docker is installed
try {
    $dockerVersion = docker --version 2>$null
    if (-not $dockerVersion) {
        throw "docker not found"
    }
} catch {
    Write-Host "❌ Error: Docker is not installed or not running"
    Write-Host "Make sure Docker Desktop is running"
    exit 1
}

# Set project
Write-Host "📋 Setting project..."
gcloud config set project $PROJECT_ID

# Enable necessary APIs
Write-Host "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable firestore.googleapis.com

# Build Docker image
Write-Host ""
Write-Host "🔨 Building Docker image..."
docker build -t $IMAGE_NAME .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed"
    exit 1
}

# Configure Docker for gcloud
Write-Host ""
Write-Host "🔐 Authenticating Docker..."
gcloud auth configure-docker

# Push image to Google Container Registry
Write-Host ""
Write-Host "📤 Pushing image to GCR..."
docker push $IMAGE_NAME

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker push failed"
    exit 1
}

# Check if SUPABASE_JWT_SECRET is set
Write-Host ""
Write-Host "🔑 Checking for SUPABASE_JWT_SECRET..."
$SUPABASE_JWT_SECRET = $env:SUPABASE_JWT_SECRET
if (-not $SUPABASE_JWT_SECRET) {
    Write-Host "⚠️  WARNING: SUPABASE_JWT_SECRET environment variable not set"
    Write-Host "   The backend will not be able to authenticate requests"
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        Write-Host "❌ Deployment cancelled"
        Write-Host ""
        Write-Host "To set the secret, run:"
        Write-Host '   $env:SUPABASE_JWT_SECRET = "your-secret-here"'
        exit 1
    }
}

# Deploy to Cloud Run
Write-Host ""
Write-Host "🚀 Deploying to Cloud Run..."

$deployArgs = @(
    "run", "deploy", $SERVICE_NAME,
    "--image", $IMAGE_NAME,
    "--platform", "managed",
    "--region", $REGION,
    "--allow-unauthenticated",
    "--memory", "4Gi",
    "--cpu", "2",
    "--timeout", "900",
    "--max-instances", "10",
    "--set-env-vars", "PROJECT_ID=$PROJECT_ID",
    "--set-env-vars", "BUCKET_NAME=$BUCKET_NAME"
)

# Add JWT secret if available
if ($SUPABASE_JWT_SECRET) {
    $deployArgs += "--set-env-vars"
    $deployArgs += "SUPABASE_JWT_SECRET=$SUPABASE_JWT_SECRET"
}

& gcloud @deployArgs

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Cloud Run deployment failed"
    exit 1
}

# Get service URL
Write-Host ""
Write-Host "📡 Getting service URL..."
$SERVICE_URL = gcloud run services describe $SERVICE_NAME --region $REGION --format "value(status.url)"

Write-Host ""
Write-Host "=========================================="
Write-Host "✅ Deployment completed successfully!"
Write-Host "=========================================="
Write-Host "Service URL: $SERVICE_URL"
Write-Host "Health Check: $SERVICE_URL/health"
Write-Host ""
Write-Host "API Endpoints:"
Write-Host "  - POST $SERVICE_URL/api/generate-upload-url"
Write-Host "  - POST $SERVICE_URL/api/start-mastering-job"
Write-Host "  - GET  $SERVICE_URL/api/get-job-status/{jobId}"
Write-Host ""

if (-not $SUPABASE_JWT_SECRET) {
    Write-Host "⚠️  IMPORTANT: Set SUPABASE_JWT_SECRET environment variable:"
    Write-Host ""
    Write-Host "   gcloud run services update $SERVICE_NAME \"
    Write-Host "     --region $REGION \"
    Write-Host "     --set-env-vars `"SUPABASE_JWT_SECRET=your-secret-here`""
    Write-Host ""
}

Write-Host "🧪 Testing health endpoint..."
try {
    $health = Invoke-RestMethod -Uri "$SERVICE_URL/health" -Method Get
    if ($health.status -eq "OK") {
        Write-Host "✅ Backend is healthy and responding!"
    }
} catch {
    Write-Host "⚠️  Health check failed, but deployment succeeded"
    Write-Host "   URL: $SERVICE_URL/health"
}

Write-Host ""
Write-Host "=========================================="
Write-Host "Next steps:"
Write-Host "1. Update frontend environment variable:"
Write-Host "   VITE_BACKEND_URL=$SERVICE_URL"
Write-Host "2. Upload genre preset reference files (see PRESET_REFERENCE_UPLOAD_GUIDE.md)"
Write-Host "3. Test the mastering flow in the application"
Write-Host "=========================================="
Write-Host ""

