#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script de prueba para verificar que el backend funciona correctamente
"""
import sys
import os
import io

# Configurar encoding para Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Agregar el directorio actual al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Prueba que todas las importaciones funcionen"""
    print("[TEST] Probando importaciones...")
    try:
        import matchering as mg
        print("  [OK] matchering")
        
        from fastapi import FastAPI
        print("  [OK] fastapi")
        
        from google.cloud import storage
        print("  [OK] google.cloud.storage")
        
        import requests
        print("  [OK] requests")
        
        import main
        print("  [OK] main (modulo principal)")
        
        return True
    except ImportError as e:
        print(f"  [ERROR] Error de importacion: {e}")
        return False
    except Exception as e:
        print(f"  [ERROR] Error inesperado: {e}")
        return False

def test_app_creation():
    """Prueba que la app FastAPI se pueda crear"""
    print("\n[TEST] Probando creacion de app FastAPI...")
    try:
        import main
        app = main.app
        print(f"  [OK] App creada: {app.title}")
        print(f"  [OK] Version: {app.version}")
        return True
    except Exception as e:
        print(f"  [ERROR] Error: {e}")
        return False

def test_endpoints():
    """Prueba que los endpoints estén definidos"""
    print("\n[TEST] Probando endpoints...")
    try:
        import main
        app = main.app
        
        routes = [route.path for route in app.routes]
        expected_routes = ["/", "/health", "/supported-formats", "/process/ai-mastering", "/api/master-audio"]
        
        print(f"  📋 Endpoints encontrados: {len(routes)}")
        for route in routes:
            print(f"    - {route}")
        
        missing = [r for r in expected_routes if r not in routes]
        if missing:
            print(f"  [WARN] Endpoints faltantes: {missing}")
            return False
        else:
            print("  [OK] Todos los endpoints esperados estan presentes")
            return True
    except Exception as e:
        print(f"  [ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_config_functions():
    """Prueba las funciones de configuración"""
    print("\n[TEST] Probando funciones de configuracion...")
    try:
        import main
        
        # Probar get_matchering_config
        config = main.get_matchering_config("Rock", "medium")
        print(f"  [OK] get_matchering_config funciona")
        print(f"     - allow_equality: {config.allow_equality}")
        print(f"     - threshold: {config.threshold:.6f}")
        
        # Probar get_storage_client (puede fallar si no hay credenciales, pero no debe crashear)
        try:
            client = main.get_storage_client()
            if client:
                print("  [OK] get_storage_client funciona (con credenciales)")
            else:
                print("  [WARN] get_storage_client retorna None (sin credenciales - OK para desarrollo)")
        except Exception as e:
            print(f"  [WARN] get_storage_client error esperado sin credenciales: {type(e).__name__}")
        
        return True
    except Exception as e:
        print(f"  [ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 70)
    print("PRUEBA DEL BACKEND - LEVEL AUDIO")
    print("=" * 70)
    
    results = []
    
    results.append(("Importaciones", test_imports()))
    results.append(("Creacion de App", test_app_creation()))
    results.append(("Endpoints", test_endpoints()))
    results.append(("Funciones de Config", test_config_functions()))
    
    print("\n" + "=" * 70)
    print("RESUMEN DE PRUEBAS")
    print("=" * 70)
    
    for name, result in results:
        status = "[OK] PASO" if result else "[ERROR] FALLO"
        print(f"{status} - {name}")
    
    all_passed = all(result for _, result in results)
    
    print("=" * 70)
    if all_passed:
        print("[OK] TODAS LAS PRUEBAS PASARON")
        sys.exit(0)
    else:
        print("[ERROR] ALGUNAS PRUEBAS FALLARON")
        sys.exit(1)

