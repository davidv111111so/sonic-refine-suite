// frontend/src/AImastering.tsx
import React, { useState } from "react";
import axios from "axios";
import { saveAs } from "file-saver";

const AImastering: React.FC = () => {
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleMastering = async () => {
    // Validación: verificar que ambos archivos estén seleccionados
    if (!targetFile || !referenceFile) {
      alert("Por favor, selecciona ambos archivos (Target y Reference)");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    try {
      // Crear FormData para enviar los archivos
      const formData = new FormData();
      formData.append("target", targetFile);
      formData.append("reference", referenceFile);

      // Enviar al backend
      const response = await axios.post(
        "http://127.0.0.1:8000/process/ai-mastering",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          responseType: "blob", // Importante: recibir el archivo como blob
        },
      );

      // Descargar el archivo masterizado
      const outputFilename = `mastered_${targetFile.name}`;
      saveAs(response.data, outputFilename);

      alert("¡Masterización completada! El archivo se está descargando.");
    } catch (error: any) {
      console.error("Error en la masterización:", error);
      const errorMsg = error.response?.data
        ? "Error del servidor. Revisa la consola del backend."
        : "Error de conexión con el backend.";
      setErrorMessage(errorMsg);
      alert(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      style={{
        padding: "2rem",
        margin: "2rem auto",
        maxWidth: "600px",
        backgroundColor: "#2d2d2d",
        color: "white",
        borderRadius: "12px",
        border: "1px solid #444",
      }}
    >
      <h1 style={{ marginBottom: "1rem", textAlign: "center" }}>
        🎵 AI Mastering
      </h1>
      <p style={{ marginBottom: "2rem", textAlign: "center", color: "#aaa" }}>
        Sube tu audio y una referencia para aplicar masterización automática
      </p>

      {/* Target File */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: "bold",
          }}
        >
          Target File (Audio a Masterizar):
        </label>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setTargetFile(e.target.files?.[0] || null)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #555",
            backgroundColor: "#1a1a1a",
            color: "white",
          }}
        />
        {targetFile && (
          <p
            style={{ marginTop: "0.5rem", fontSize: "0.9em", color: "#4ade80" }}
          >
            ✓ {targetFile.name}
          </p>
        )}
      </div>

      {/* Reference File */}
      <div style={{ marginBottom: "2rem" }}>
        <label
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: "bold",
          }}
        >
          Reference File (Audio de Referencia):
        </label>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setReferenceFile(e.target.files?.[0] || null)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #555",
            backgroundColor: "#1a1a1a",
            color: "white",
          }}
        />
        {referenceFile && (
          <p
            style={{ marginTop: "0.5rem", fontSize: "0.9em", color: "#4ade80" }}
          >
            ✓ {referenceFile.name}
          </p>
        )}
      </div>

      {/* Botón de Masterización */}
      <button
        onClick={handleMastering}
        disabled={isProcessing}
        style={{
          width: "100%",
          padding: "15px",
          fontSize: "18px",
          fontWeight: "bold",
          cursor: isProcessing ? "not-allowed" : "pointer",
          backgroundColor: isProcessing ? "#555" : "#007acc",
          color: "white",
          border: "none",
          borderRadius: "8px",
          transition: "background-color 0.3s",
        }}
      >
        {isProcessing ? "Procesando... ⏳" : "Iniciar Masterización 🚀"}
      </button>

      {/* Mensaje de Error */}
      {errorMessage && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            backgroundColor: "#ff4444",
            borderRadius: "5px",
            color: "white",
          }}
        >
          ⚠️ {errorMessage}
        </div>
      )}
    </div>
  );
};

export default AImastering;
