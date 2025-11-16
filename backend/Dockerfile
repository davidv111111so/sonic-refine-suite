FROM python:3.9-slim

WORKDIR /app

# Instalar dependencias del sistema para audio
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements primero para aprovechar cache de Docker
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código
COPY . .

# Exponer el puerto esperado por Cloud Run
EXPOSE 8080

# Cloud Run establece la variable PORT automáticamente
# Usar uvicorn para FastAPI con workers para mejor rendimiento
ENV PORT=8080
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 1 --timeout-keep-alive 300

