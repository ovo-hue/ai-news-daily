import threading
import time
from flask import Flask, jsonify, send_from_directory

from .config import FRONTEND_DIR
from .main import run as run_pipeline

app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")

_state = {
    "running": False,
    "last_error": None,
    "last_completed_at": None,
}
_lock = threading.Lock()


def _do_refresh():
    try:
        run_pipeline()
        _state["last_completed_at"] = int(time.time())
        _state["last_error"] = None
    except Exception as e:
        _state["last_error"] = str(e)
    finally:
        _state["running"] = False


@app.route("/")
def root():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/api/refresh", methods=["POST"])
def refresh():
    with _lock:
        if _state["running"]:
            return jsonify({"status": "already_running"}), 409
        _state["running"] = True
        _state["last_error"] = None
    threading.Thread(target=_do_refresh, daemon=True).start()
    return jsonify({"status": "started"})


@app.route("/api/refresh/status")
def refresh_status():
    return jsonify(_state)


if __name__ == "__main__":
    print("AI 资讯日报 · http://127.0.0.1:8765")
    app.run(host="127.0.0.1", port=8765, debug=False)
