import os

OUTPUT_FILE = "todo_el_proyecto.txt"

EXCLUDE_DIRS = {
    ".git",
    "node_modules",
    "__pycache__",
    "venv",
    "env",
    "assets",
    "js/vendor"
}

with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

        for file in files:
            path = os.path.join(root, file)

            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()

                out.write("\n\n" + "=" * 80 + "\n")
                out.write(f"ARCHIVO: {path}\n")
                out.write("=" * 80 + "\n")
                out.write(content)

            except Exception as e:
                out.write(f"\n\n[ERROR LEYENDO {path}: {e}]\n")

print("✅ Archivos unidos en:", OUTPUT_FILE)
