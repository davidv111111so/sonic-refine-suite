FROM python:3.11-slim

# Install system dependencies for audio processing
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    ffmpeg \
    libmagic1 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements-docker.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Install Spleeter in an isolated virtual environment to avoid Click version conflicts with Flask
RUN python -m venv /opt/spleeter-env && \
    /opt/spleeter-env/bin/pip install --no-cache-dir spleeter==2.4.2

# Copy application code
COPY . .

# Set environment variable for spleeter path
ENV SPLEETER_PATH=/opt/spleeter-env/bin/spleeter

# Expose port
EXPOSE 8080

# Run with gunicorn
CMD exec gunicorn --bind :8080 --workers 1 --threads 8 --timeout 900 main:app
