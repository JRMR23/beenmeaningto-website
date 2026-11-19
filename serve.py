"""Preview the Been Meaning To website locally, without the browser caching old files.

Run:  python3 serve.py        then open http://localhost:4174
"""
import http.server
import os
import socketserver

PORT = 4174
os.chdir(os.path.dirname(os.path.abspath(__file__)))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Always fetch the latest files, so a normal refresh shows your changes.
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", PORT), NoCacheHandler) as httpd:
    print(f"Been Meaning To site running at http://localhost:{PORT}  (Ctrl+C to stop)")
    httpd.serve_forever()
