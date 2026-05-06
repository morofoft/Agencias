import os
import shutil
import tempfile
from pathlib import Path

def limpiar_carpeta(ruta):
    if not os.path.exists(ruta):
        return

    for archivo in os.listdir(ruta):
        ruta_completa = os.path.join(ruta, archivo)
        try:
            if os.path.isfile(ruta_completa) or os.path.islink(ruta_completa):
                os.unlink(ruta_completa)
            elif os.path.isdir(ruta_completa):
                shutil.rmtree(ruta_completa)
        except Exception as e:
            print(f"No se pudo eliminar {ruta_completa}: {e}")

def limpiar_temp():
    print("🧹 Limpiando archivos temporales...")
    temp_dir = tempfile.gettempdir()
    limpiar_carpeta(temp_dir)

def limpiar_prefetch():
    print("🧹 Limpiando Prefetch...")
    ruta = r"C:\Windows\Prefetch"
    limpiar_carpeta(ruta)

def limpiar_papelera():
    print("🧹 Limpiando papelera...")
    ruta = r"C:\$Recycle.Bin"
    limpiar_carpeta(ruta)

def main():
    print("🚀 Iniciando limpieza...")

    limpiar_temp()
    limpiar_prefetch()
    limpiar_papelera()

    print("✅ Limpieza completada")

if __name__ == "__main__":
    main()