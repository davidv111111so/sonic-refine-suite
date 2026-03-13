FROM python:3.9-slim

WORKDIR /app

# Instala dependencias del sistema para audio (libsndfile y ffmpeg)
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copia y instala las dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia todo el código de tu backend
COPY . .

# Expone el puerto que Google Cloud Run espera
EXPOSE 8080

# Comando para iniciar el servidor FastAPI con Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--timeout", "300"]