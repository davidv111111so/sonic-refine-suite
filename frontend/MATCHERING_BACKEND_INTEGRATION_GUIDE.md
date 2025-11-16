# Matchering Backend Integration Guide

## Complete Guide for Non-Technical Users

This guide will help you integrate the Matchering Python backend with your Spectrum application to enable AI Audio Mastering functionality.

---

## 📋 What is Matchering?

Matchering is an open-source audio mastering library that uses machine learning to match the sound characteristics of a target audio file to a reference track. It's the engine behind Spectrum's AI Audio Mastering feature.

**GitHub Repository**: https://github.com/sergree/matchering

---

## 🎯 Integration Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Spectrum UI   │  HTTP   │  Supabase Edge   │  HTTP   │   Matchering    │
│   (Frontend)    │────────>│    Function      │────────>│  Python Server  │
│   React/TS      │         │   (Middleware)   │         │  (Backend API)  │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

---

## 🛠️ Prerequisites

Before starting, ensure you have:
- [ ] A server or cloud instance (AWS, DigitalOcean, Heroku, etc.)
- [ ] Basic command-line knowledge
- [ ] SSH access to your server
- [ ] Admin access to the Spectrum application

---

## 📦 Part 1: Setting Up the Matchering Backend

### Option A: Using Docker (Easiest - Recommended)

#### Step 1.1: Install Docker
On your server, run:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose -y

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker
```

#### Step 1.2: Create Matchering API Server

Create a new directory:
```bash
mkdir matchering-api
cd matchering-api
```

Create `Dockerfile`:
```dockerfile
FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir \
    matchering \
    flask \
    flask-cors \
    gunicorn

# Create app directory
WORKDIR /app

# Copy application code
COPY app.py /app/

# Expose port
EXPOSE 8000

# Run with Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "300", "app:app"]
```

Create `app.py`:
```python
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import matchering as mg
import os
import tempfile
import traceback
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure upload settings
UPLOAD_FOLDER = tempfile.gettempdir()
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'flac', 'ogg'}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'matchering-api',
        'version': mg.__version__
    }), 200

@app.route('/master', methods=['POST'])
def master_audio():
    """
    Master audio using Matchering
    
    Form data:
    - target: Target audio file (required)
    - reference: Reference audio file (required)
    - preset: Genre preset name (optional, overrides reference)
    - settings: JSON object with mastering settings (optional)
    """
    try:
        # Validate files
        if 'target' not in request.files:
            return jsonify({'error': 'Target file is required'}), 400
        
        target_file = request.files['target']
        if target_file.filename == '':
            return jsonify({'error': 'No target file selected'}), 400
        
        if not allowed_file(target_file.filename):
            return jsonify({'error': 'Invalid target file format'}), 400
        
        # Check if using preset or reference file
        use_preset = request.form.get('preset')
        
        if not use_preset:
            if 'reference' not in request.files:
                return jsonify({'error': 'Reference file or preset is required'}), 400
            
            reference_file = request.files['reference']
            if reference_file.filename == '':
                return jsonify({'error': 'No reference file selected'}), 400
            
            if not allowed_file(reference_file.filename):
                return jsonify({'error': 'Invalid reference file format'}), 400
        
        # Save uploaded files
        target_path = os.path.join(
            app.config['UPLOAD_FOLDER'],
            secure_filename(f"target_{target_file.filename}")
        )
        target_file.save(target_path)
        
        reference_path = None
        if not use_preset:
            reference_path = os.path.join(
                app.config['UPLOAD_FOLDER'],
                secure_filename(f"reference_{reference_file.filename}")
            )
            reference_file.save(reference_path)
        
        # Output file path
        output_path = os.path.join(
            app.config['UPLOAD_FOLDER'],
            f"mastered_{os.path.basename(target_path)}"
        )
        
        # Parse settings if provided
        settings = {}
        if request.form.get('settings'):
            import json
            settings = json.loads(request.form.get('settings'))
        
        # Apply mastering
        if use_preset:
            # Using preset (you'll need to implement preset logic)
            # For now, we'll use default mastering
            mg.process(
                target=target_path,
                reference=target_path,  # Self-reference with preset
                results=[mg.pcm16(output_path)],
                **settings
            )
        else:
            # Using reference file
            mg.process(
                target=target_path,
                reference=reference_path,
                results=[mg.pcm16(output_path)],
                **settings
            )
        
        # Clean up input files
        os.remove(target_path)
        if reference_path:
            os.remove(reference_path)
        
        # Send the processed file
        return send_file(
            output_path,
            mimetype='audio/wav',
            as_attachment=True,
            download_name=f"mastered_{target_file.filename}"
        )
    
    except Exception as e:
        print(f"Error processing audio: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'error': 'Processing failed',
            'details': str(e)
        }), 500

@app.route('/presets', methods=['GET'])
def get_presets():
    """Get available mastering presets"""
    presets = [
        'Flat', 'Bass Boost', 'Treble Boost', 'V-Shape', 
        'Vocal', 'Rock', 'Jazz', 'Classical', 'Electronic',
        'Hip-Hop', 'Podcast', 'Live'
    ]
    return jsonify({'presets': presets}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=False)
```

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  matchering-api:
    build: .
    ports:
      - "8000:8000"
    restart: unless-stopped
    environment:
      - FLASK_ENV=production
    volumes:
      - ./logs:/app/logs
```

#### Step 1.3: Build and Run
```bash
# Build the Docker image
sudo docker-compose build

# Start the service
sudo docker-compose up -d

# Check if it's running
sudo docker-compose ps

# Check logs
sudo docker-compose logs -f
```

#### Step 1.4: Test the API
```bash
# Test health endpoint
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","service":"matchering-api","version":"2.0.x"}
```

---

### Option B: Manual Installation (Advanced Users)

#### Step 2.1: Install Python and Dependencies
```bash
# Install Python 3.9+
sudo apt update
sudo apt install python3 python3-pip ffmpeg libsndfile1 -y

# Install Matchering and Flask
pip3 install matchering flask flask-cors gunicorn
```

#### Step 2.2: Create the API Server
Copy the `app.py` file from Option A above.

#### Step 2.3: Run with Gunicorn
```bash
gunicorn --bind 0.0.0.0:8000 --workers 4 --timeout 300 app:app
```

#### Step 2.4: Create systemd Service (for automatic startup)
Create `/etc/systemd/system/matchering-api.service`:
```ini
[Unit]
Description=Matchering API Service
After=network.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/path/to/matchering-api
ExecStart=/usr/local/bin/gunicorn --bind 0.0.0.0:8000 --workers 4 --timeout 300 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable matchering-api
sudo systemctl start matchering-api
sudo systemctl status matchering-api
```

---

## 🌐 Part 2: Expose Your API to the Internet

### Option A: Using Nginx Reverse Proxy (Recommended)

#### Step 1: Install Nginx
```bash
sudo apt install nginx -y
```

#### Step 2: Configure Nginx
Create `/etc/nginx/sites-available/matchering-api`:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeouts for large file processing
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
        send_timeout 300;
        
        # Increase max body size
        client_max_body_size 100M;
    }
}
```

#### Step 3: Enable Configuration
```bash
sudo ln -s /etc/nginx/sites-available/matchering-api /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

#### Step 4: Setup SSL (HTTPS) with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
sudo systemctl reload nginx
```

---

### Option B: Using Cloudflare Tunnel (No Port Forwarding Needed)

#### Step 1: Install cloudflared
```bash
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

#### Step 2: Authenticate
```bash
cloudflared tunnel login
```

#### Step 3: Create Tunnel
```bash
cloudflared tunnel create matchering-api
cloudflared tunnel route dns matchering-api matchering.your-domain.com
```

#### Step 4: Configure Tunnel
Create `~/.cloudflared/config.yml`:
```yaml
tunnel: <your-tunnel-id>
credentials-file: /home/your-user/.cloudflared/<your-tunnel-id>.json

ingress:
  - hostname: matchering.your-domain.com
    service: http://localhost:8000
  - service: http_status:404
```

#### Step 5: Run Tunnel
```bash
cloudflared tunnel run matchering-api
```

---

## 🔗 Part 3: Update Spectrum Edge Function

Now that your Matchering backend is running, update the Supabase Edge Function:

### Step 1: Open Edge Function
Navigate to: `supabase/functions/ai-mastering/index.ts`

### Step 2: Update the Backend URL
Find the line with the placeholder URL and replace it:

```typescript
// Replace this line:
const MATCHERING_API_URL = 'http://your-matchering-server.com';

// With your actual URL:
const MATCHERING_API_URL = 'https://matchering.your-domain.com';
// OR
const MATCHERING_API_URL = 'http://your-server-ip:8000';
```

### Step 3: Test the Integration
The updated edge function code should look like this:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MATCHERING_API_URL = 'https://your-matchering-api.com';  // UPDATE THIS

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get form data from request
    const formData = await req.formData();
    
    // Forward to Matchering API
    const response = await fetch(`${MATCHERING_API_URL}/master`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Matchering API error: ${error}`);
    }

    // Get the processed audio file
    const audioBlob = await response.blob();
    
    // Return the processed file
    return new Response(audioBlob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/wav',
        'Content-Disposition': 'attachment; filename="mastered.wav"'
      }
    });

  } catch (error) {
    console.error('AI Mastering error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
```

---

## 🧪 Part 4: Testing the Complete Integration

### Test 1: Backend Health Check
```bash
curl https://your-matchering-api.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "matchering-api",
  "version": "2.0.x"
}
```

### Test 2: Test Mastering Endpoint
```bash
curl -X POST https://your-matchering-api.com/master \
  -F "target=@/path/to/target.wav" \
  -F "reference=@/path/to/reference.wav" \
  -o mastered_output.wav
```

### Test 3: Test from Spectrum UI
1. Log in to Spectrum
2. Navigate to AI Mastering tab
3. Upload target and reference files
4. Click "Process Audio"
5. Wait for processing
6. Download the mastered file

---

## 📊 Part 5: Monitoring and Maintenance

### Check Docker Logs
```bash
sudo docker-compose logs -f matchering-api
```

### Check System Resources
```bash
# CPU and memory usage
htop

# Disk space
df -h

# Docker stats
sudo docker stats
```

### Restart Services
```bash
# Restart Docker container
sudo docker-compose restart

# Restart Nginx
sudo systemctl restart nginx

# Restart systemd service
sudo systemctl restart matchering-api
```

---

## 🔒 Part 6: Security Considerations

### 1. Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 2. Rate Limiting (Nginx)
Add to your Nginx configuration:
```nginx
limit_req_zone $binary_remote_addr zone=matchering:10m rate=10r/m;

location / {
    limit_req zone=matchering burst=20;
    # ... rest of config
}
```

### 3. API Authentication (Optional)
Update `app.py` to require API keys:
```python
API_KEY = os.environ.get('MATCHERING_API_KEY', 'your-secret-key')

@app.before_request
def check_api_key():
    if request.endpoint != 'health_check':
        api_key = request.headers.get('X-API-Key')
        if api_key != API_KEY:
            return jsonify({'error': 'Invalid API key'}), 401
```

---

## ⚡ Part 7: Performance Optimization

### 1. Increase Worker Processes
Edit `docker-compose.yml`:
```yaml
command: gunicorn --bind 0.0.0.0:8000 --workers 8 --timeout 300 app:app
```

### 2. Add Redis Caching (Advanced)
For caching processed results:
```bash
sudo docker-compose up -d redis
```

### 3. Use CDN
For distributing the load geographically, consider using Cloudflare or AWS CloudFront.

---

## 🆘 Troubleshooting

### Problem: Cannot connect to API
**Solutions:**
1. Check if service is running: `sudo docker-compose ps`
2. Check logs: `sudo docker-compose logs`
3. Verify firewall: `sudo ufw status`
4. Test locally: `curl http://localhost:8000/health`

### Problem: Processing takes too long
**Solutions:**
1. Increase timeout in Nginx configuration
2. Add more worker processes
3. Upgrade server resources (CPU/RAM)
4. Optimize audio file size before processing

### Problem: Out of disk space
**Solutions:**
1. Clean up temporary files: `sudo rm -rf /tmp/*`
2. Add cleanup script to regularly remove old files
3. Increase disk space

### Problem: High CPU usage
**Solutions:**
1. Limit concurrent requests
2. Add rate limiting
3. Upgrade server CPU
4. Implement queuing system

---

## 📈 Part 8: Scaling (Advanced)

### Horizontal Scaling with Load Balancer
```nginx
upstream matchering_backend {
    server server1.example.com:8000;
    server server2.example.com:8000;
    server server3.example.com:8000;
}

server {
    location / {
        proxy_pass http://matchering_backend;
    }
}
```

### Using Kubernetes (Production)
For high-traffic production environments, consider deploying with Kubernetes for automatic scaling and load balancing.

---

## 📞 Support and Resources

### Official Resources
- **Matchering GitHub**: https://github.com/sergree/matchering
- **Matchering Documentation**: https://github.com/sergree/matchering/wiki
- **Flask Documentation**: https://flask.palletsprojects.com/

### Community Support
- **Spectrum Discord**: [Your Discord Link]
- **GitHub Issues**: [Your GitHub Repo]

---

## ✅ Deployment Checklist

Before going live, ensure:
- [ ] Backend API is running and accessible
- [ ] Health check endpoint returns 200
- [ ] SSL/HTTPS is configured
- [ ] Firewall rules are set
- [ ] Rate limiting is enabled
- [ ] Monitoring is in place
- [ ] Backups are configured
- [ ] Edge function URL is updated
- [ ] End-to-end testing completed
- [ ] Load testing performed
- [ ] Documentation is updated

---

## 🎉 Congratulations!

Your Matchering backend is now fully integrated with Spectrum! Users can now use AI Audio Mastering to professionally master their audio files.

**Next Steps:**
1. Monitor usage and performance
2. Gather user feedback
3. Optimize based on usage patterns
4. Consider premium features for monetization

---

*Last Updated: October 13, 2025*  
*Guide Version: 1.0*  
*Maintained by: Spectrum Development Team*
