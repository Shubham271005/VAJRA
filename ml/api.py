"""
VAJRA AI Microservice API Server
Provides high-speed REST endpoints for real-time neural nowcast inference.
Runs on port 8000 with full CORS support.
"""

import json
import os
import sys
from http.server import HTTPServer, ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

from inference import VajraInferenceEngine

# Initialize inference engine in memory once at server startup
print("[API] Initializing VAJRA Neural Inference Engine...")
ENGINE = VajraInferenceEngine()


class VajraAPIHandler(BaseHTTPRequestHandler):
    def _send_json_response(self, status_code: int, data: dict):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        # Health endpoint
        if path in ["/health", "/api/health"]:
            payload = {
                "status": "ONLINE",
                "service": "VAJRA Kedarnath 2013 Neural Nowcasting Microservice",
                "architecture": "VajraNowcastNet (ConvLSTM + Dual-Head)",
                "checkpoint": "vajra_kedarnath_model.pt",
                "checkpointEpoch": ENGINE.best_epoch,
                "validationLoss": ENGINE.best_loss,
            }
            self._send_json_response(200, payload)
            return

        # Live Nowcast Prediction endpoint
        if path in ["/api/predict", "/api/nowcast", "/api/simulation"]:
            sample_idx = int(query.get("sample", [15])[0])
            loc_id = query.get("location", [None])[0]
            try:
                result = ENGINE.run_inference(sample_idx=sample_idx, location_id=loc_id)
                self._send_json_response(200, result)
            except Exception as e:
                self._send_json_response(500, {"success": False, "error": str(e)})
            return

        # Fallback 404
        self._send_json_response(404, {"error": f"Endpoint {path} not found"})

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path in ["/api/predict", "/api/nowcast", "/api/simulation"]:
            content_length = int(self.headers.get("Content-Length", 0))
            body = {}
            if content_length > 0:
                try:
                    raw_body = self.rfile.read(content_length)
                    body = json.loads(raw_body.decode("utf-8"))
                except Exception:
                    pass

            sample_idx = body.get("sample", 15)
            loc_id = body.get("location", None)
            try:
                result = ENGINE.run_inference(sample_idx=sample_idx, location_id=loc_id)
                self._send_json_response(200, result)
            except Exception as e:
                self._send_json_response(500, {"success": False, "error": str(e)})
            return

        self._send_json_response(404, {"error": f"Endpoint {path} not found"})

    def log_message(self, format, *args):
        sys.stderr.write(f"[API] {self.address_string()} - {format % args}\n")


def start_server(port: int = 8000):
    server = ThreadingHTTPServer(("0.0.0.0", port), VajraAPIHandler)
    print("=" * 65)
    print(f"  VAJRA Neural Inference Microservice is LIVE!")
    print(f"  Listening on: http://localhost:{port}")
    print(f"  Endpoints:")
    print(f"    - Health: http://localhost:{port}/api/health")
    print(f"    - Nowcast: http://localhost:{port}/api/predict")
    print("=" * 65)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down API server...")
        server.server_close()


if __name__ == "__main__":
    port = int(os.environ.get("AI_PORT", 8000))
    start_server(port)
