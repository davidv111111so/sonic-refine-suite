"""
AI Mastering Backend
Flask application for processing audio files with Matchering
Supports MP3, WAV, and FLAC input formats
"""
import os
import io
import time
import tempfile
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import matchering as mg
import soundfile as sf
import librosa

app = Flask(__name__)

# Configure CORS
# Configure CORS
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "expose_headers": ["Content-Type", "Content-Length", "Content-Disposition"],
        "supports_credentials": False  # Changed to False to allow '*' origin
    }
})

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "OK", "service": "AI Mastering Backend"}), 200

def convert_to_wav(input_path, output_path):
    """Convert any audio format to WAV using librosa and soundfile"""
    try:
        # Load audio file (supports MP3, FLAC, WAV, etc.)
        audio, sample_rate = librosa.load(input_path, sr=None, mono=False)
        # Export as WAV
        sf.write(output_path, audio.T if len(audio.shape) > 1 else audio, sample_rate)
        return True
    except Exception as e:
        print(f"❌ Conversion error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

@app.route('/api/master-audio', methods=['POST', 'OPTIONS'])
def master_audio():
    """Process audio files with Matchering - supports MP3, WAV, FLAC"""
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 204
    
    start_time = time.time()
    temp_files = []
    
    try:
        # Check if files are in the request
        if 'target' not in request.files or 'reference' not in request.files:
            return jsonify({"error": "Missing target or reference audio files"}), 400
        
        target_file = request.files['target']
        reference_file = request.files['reference']
        
        # Get settings if provided
        settings = {}
        if 'settings' in request.form:
            import json
            settings = json.loads(request.form['settings'])
        
        print(f"📥 Received files: target={target_file.filename}, reference={reference_file.filename}")
        
        # Determine file extensions
        target_ext = os.path.splitext(target_file.filename)[1].lower()
        reference_ext = os.path.splitext(reference_file.filename)[1].lower()
        
        # Supported formats
        supported_formats = ['.mp3', '.wav', '.flac']
        if target_ext not in supported_formats or reference_ext not in supported_formats:
            return jsonify({
                "error": f"Unsupported file format. Supported: {', '.join(supported_formats)}"
            }), 400
        
        # Save uploaded files to temp locations
        temp_target_upload = tempfile.NamedTemporaryFile(delete=False, suffix=target_ext)
        target_file.save(temp_target_upload.name)
        temp_target_upload.close()
        temp_files.append(temp_target_upload.name)
        
        temp_reference_upload = tempfile.NamedTemporaryFile(delete=False, suffix=reference_ext)
        reference_file.save(temp_reference_upload.name)
        temp_reference_upload.close()
        temp_files.append(temp_reference_upload.name)
        
        # Convert to WAV for Matchering (it only works reliably with WAV)
        print(f"🔄 Converting files to WAV format...")
        temp_target_wav = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
        temp_target_wav.close()
        target_path = temp_target_wav.name
        temp_files.append(target_path)
        
        temp_reference_wav = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
        temp_reference_wav.close()
        reference_path = temp_reference_wav.name
        temp_files.append(reference_path)
        
        # Convert both files to WAV
        if not convert_to_wav(temp_target_upload.name, target_path):
            return jsonify({"error": "Failed to convert target file to WAV"}), 500
        
        if not convert_to_wav(temp_reference_upload.name, reference_path):
            return jsonify({"error": "Failed to convert reference file to WAV"}), 500
        
        print(f"✅ Files converted to WAV successfully")
        
        # Output path - always WAV for Matchering
        temp_output = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
        temp_output.close()
        output_path = temp_output.name
        temp_files.append(output_path)
        
        # Process with Matchering
        print(f"🎵 Starting Matchering processing...")
        print(f"   Target: {target_path} ({target_ext})")
        print(f"   Reference: {reference_path} ({reference_ext})")
        
        try:
            # Configure output bit depth
            output_bits = settings.get('output_bits', 16)
            if output_bits == 16:
                result_format = mg.pcm16(output_path)
            elif output_bits == 24:
                result_format = mg.pcm24(output_path)
            else:
                result_format = mg.pcm32(output_path)
            
            # Process with Matchering
            # Note: Matchering only accepts target, reference, and results parameters
            mg.process(
                target=target_path,
                reference=reference_path,
                results=[result_format]
            )
            
            print(f"✅ Matchering processing complete!")
            
        except Exception as e:
            print(f"❌ Matchering error: {str(e)}")
            import traceback
            traceback.print_exc()
            # Cleanup temp files
            for path in temp_files:
                try:
                    if os.path.exists(path):
                        os.unlink(path)
                except:
                    pass
            return jsonify({"error": f"Matchering processing failed: {str(e)}"}), 500
        
        # Read the output file
        try:
            with open(output_path, 'rb') as f:
                output_data = f.read()
        except Exception as e:
            print(f"❌ Error reading output file: {str(e)}")
            return jsonify({"error": f"Failed to read output file: {str(e)}"}), 500
        finally:
            # Cleanup temp files
            for path in temp_files:
                try:
                    if os.path.exists(path):
                        os.unlink(path)
                except:
                    pass
        
        elapsed = time.time() - start_time
        print(f"⏱️ Total processing time: {elapsed:.2f}s")
        
        # Generate output filename
        base_name = os.path.splitext(target_file.filename)[0]
        output_filename = f"mastered_{base_name}.wav"
        
        # Return the audio file
        return send_file(
            io.BytesIO(output_data),
            mimetype='audio/wav',
            as_attachment=True,
            download_name=output_filename
        )
        
    except Exception as e:
        print(f"❌ Error in master_audio: {str(e)}")
        import traceback
        traceback.print_exc()
        # Cleanup any temp files
        for path in temp_files:
            try:
                if os.path.exists(path):
                    os.unlink(path)
            except:
                pass
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    print(f"🚀 Starting AI Mastering Backend on port {port}...")
    print(f"📁 Supported formats: MP3, WAV, FLAC")
    print(f"📤 Output format: WAV")
    app.run(host="0.0.0.0", port=port, debug=True)
