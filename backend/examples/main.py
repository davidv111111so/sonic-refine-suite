# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

# --- IMPORTANTE: Configuración de CORS ---
# Esto le permite a tu frontend (que corre en localhost:3000) hablar con tu backend (que corre en localhost:8000)
origins = [
    "http://localhost:3000",
    # Si Lovable usa otro puerto, añádelo aquí. Por ejemplo: "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Endpoint de prueba ---
@app.get("/")
def read_root():
    return {"message": "Backend is running!"}


# --- AQUI IRA LA LOGICA DE MATCHERNG DESPUES ---

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
