# Backend Python - CORS Configuration

## Flask + Flask-CORS

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)

# Configure CORS from environment variable
allowed_origins = os.getenv('ALLOWED_ORIGINS', '*')
if allowed_origins != '*':
    allowed_origins = allowed_origins.split(',')

CORS(app,
     resources={r"/api/*": {
         "origins": allowed_origins,
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization"],
         "expose_headers": ["Content-Type", "Authorization"],
         "supports_credentials": True,
         "max_age": 3600
     }})

@app.route('/api/master-audio', methods=['POST', 'OPTIONS'])
def master_audio():
    # Handle preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        return response, 204
    
    # Your mastering logic here
    try:
        data = request.json
        # ... process audio ...
        
        return jsonify({
            'success': True,
            'masteredUrl': 'https://...'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
```

## FastAPI

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

app = FastAPI()

# Configure CORS
allowed_origins = os.getenv('ALLOWED_ORIGINS', '*')
if allowed_origins != '*':
    allowed_origins = allowed_origins.split(',')

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if isinstance(allowed_origins, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MasteringRequest(BaseModel):
    inputUrl: str
    fileName: str
    settings: dict

class MasteringResponse(BaseModel):
    success: bool
    masteredUrl: str
    jobId: str = None
    processingTime: float = None

@app.post("/api/master-audio", response_model=MasteringResponse)
async def master_audio(request: MasteringRequest):
    try:
        # Your mastering logic here
        # ... process audio ...
        
        return MasteringResponse(
            success=True,
            masteredUrl="https://...",
            jobId="uuid",
            processingTime=45.3
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv('PORT', 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
```

## Environment Variables

```bash
# .env for backend
ALLOWED_ORIGINS=https://7d506715-84dc-4abb-95cb-4ef4492a151b.lovableproject.com,https://yourdomain.com,http://localhost:8080

# Or for all origins (development only)
ALLOWED_ORIGINS=*
```

## Deploy on Google Cloud Run

```bash
# Set environment variables
gcloud run services update YOUR_SERVICE_NAME \
  --set-env-vars ALLOWED_ORIGINS="https://your-frontend.com" \
  --region us-central1
```

## Testing CORS

```bash
# Test preflight request
curl -X OPTIONS https://your-backend.run.app/api/master-audio \
  -H "Origin: https://your-frontend.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# Should return:
# Access-Control-Allow-Origin: https://your-frontend.com
# Access-Control-Allow-Methods: POST,OPTIONS
# Access-Control-Allow-Headers: Content-Type
```
