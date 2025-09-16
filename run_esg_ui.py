import subprocess
import sys
import os
import time
import webbrowser

def get_project_root():
    if getattr(sys, 'frozen', False):
        exe_dir = os.path.dirname(sys.executable)
        return os.path.dirname(exe_dir)
    return os.getcwd()

def run():
    processes = []
    try:
        project_root = get_project_root()
        backend_dir = os.path.join(project_root, "backend")
        frontend_dir = os.path.join(project_root, "frontend")

        # --- Start FastAPI backend ---
        backend = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "main:app", "--reload", "--port", "8000"],
            cwd=backend_dir
        )
        processes.append(backend)

        # --- Start Vite frontend via npm (using global npx.cmd) ---
        npx_path = r"C:\Program Files\nodejs\npx.cmd"  # Adjust if `where.exe npx` shows different
        frontend = subprocess.Popen(
            [npx_path, "npm", "run", "dev", "--", "--port", "5173", "--strictPort"],
            cwd=frontend_dir
        )
        processes.append(frontend)

        print("✅ ESG UI stack started (Frontend + Backend).")
        print("   - Frontend: http://localhost:5173")
        print("   - Backend: http://localhost:8000")

        # Give frontend a moment to boot, then open browser
        time.sleep(5)
        webbrowser.open("http://localhost:5173")

        # Keep console alive
        for p in processes:
            p.wait()

    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")
        for p in processes:
            try:
                p.terminate()
            except Exception:
                pass
        sys.exit(0)

if __name__ == "__main__":
    run()
