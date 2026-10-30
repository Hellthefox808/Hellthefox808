import http.server
import socketserver
import threading
import subprocess
import os
import json
import base64
import time
import io
from PIL import Image

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ASSETS_DIR = os.path.join(PROJECT_ROOT, "assets")
ANIMATED_DIR = os.path.join(ASSETS_DIR, "animated")
os.makedirs(ANIMATED_DIR, exist_ok=True)

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

current_frames = []

class FrameReceiver(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        payload = json.loads(post_data.decode('utf-8'))
        current_frames.extend(payload.get('frames', []))
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(b'{"status":"ok"}')

    def translate_path(self, path):
        clean_path = path.split('?')[0].lstrip('/')
        return os.path.join(PROJECT_ROOT, clean_path)

    def log_message(self, format, *args):
        pass

socketserver.TCPServer.allow_reuse_address = True
PORT = 8999
server = socketserver.TCPServer(("127.0.0.1", PORT), FrameReceiver)
server_thread = threading.Thread(target=server.serve_forever)
server_thread.daemon = True
server_thread.start()

def render_gif_asset(svg_name, gif_name, width, height, num_frames, fps, anim_script):
    global current_frames
    current_frames = []

    if os.path.exists(os.path.join(ASSETS_DIR, "motion", svg_name)):
        svg_rel_path = f"/assets/motion/{svg_name}"
    else:
        svg_rel_path = f"/assets/{svg_name}"

    html_page = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
html, body {{ width: {width}px; height: {height}px; overflow: hidden; background: #05080B; }}
#c {{ display: block; width: {width}px; height: {height}px; }}
</style>
</head>
<body>
<div id="svgContainer" style="display:none;"></div>
<canvas id="c" width="{width}" height="{height}"></canvas>
<script>
async function generate() {{
    try {{
        const res = await fetch('{svg_rel_path}');
        const svgText = await res.text();
        const container = document.getElementById('svgContainer');
        container.innerHTML = svgText;
        const svg = container.querySelector('svg');
        const canvas = document.getElementById('c');
        const ctx = canvas.getContext('2d');

        const totalFrames = {num_frames};
        const fps = {fps};
        const frames = [];

        const applyAnimation = {anim_script};

        for (let frame = 0; frame < totalFrames; frame++) {{
            const t = frame / fps;
            applyAnimation(svg, t, frame, totalFrames);

            const xml = new XMLSerializer().serializeToString(svg);
            const blob = new Blob([xml], {{type: 'image/svg+xml;charset=utf-8'}});
            const url = URL.createObjectURL(blob);
            const img = new Image();

            await new Promise((resolve, reject) => {{
                img.onload = () => {{
                    ctx.clearRect(0, 0, {width}, {height});
                    ctx.drawImage(img, 0, 0);
                    URL.revokeObjectURL(url);
                    frames.push(canvas.toDataURL('image/png').split(',')[1]);
                    resolve();
                }};
                img.onerror = (e) => reject(e);
                img.src = url;
            }});
        }}

        await fetch('/upload', {{
            method: 'POST',
            headers: {{'Content-Type': 'application/json'}},
            body: JSON.stringify({{frames: frames}})
        }});
    }} catch (err) {{
        console.error("Error in generate:", err);
    }} finally {{
        window.close();
    }}
}}
generate();
</script>
</body>
</html>"""

    temp_html_path = os.path.join(PROJECT_ROOT, f"temp_{gif_name}.html")
    with open(temp_html_path, "w", encoding="utf-8") as f:
        f.write(html_page)

    url = f"http://127.0.0.1:{PORT}/temp_{gif_name}.html"
    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        f"--window-size={width},{height}",
        url
    ]
    subprocess.run(cmd, capture_output=True, timeout=35)

    if os.path.exists(temp_html_path):
        os.remove(temp_html_path)

    if not current_frames:
        raise RuntimeError(f"Failed to receive frames for {gif_name}")

    print(f"[{gif_name}] Captured {len(current_frames)} frames. Processing GIF...")

    pil_images = []
    for b64 in current_frames:
        raw = base64.b64decode(b64)
        im = Image.open(io.BytesIO(raw)).convert("RGB")
        im_quant = im.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
        pil_images.append(im_quant)

    out_gif_path = os.path.join(ANIMATED_DIR, gif_name)
    frame_dur_ms = int(1000 / fps)

    pil_images[0].save(
        out_gif_path,
        save_all=True,
        append_images=pil_images[1:],
        duration=frame_dur_ms,
        loop=0,
        optimize=True,
        disposal=2
    )

    size_mb = os.path.getsize(out_gif_path) / (1024 * 1024)
    print(f"[SUCCESS] {gif_name}: {width}x{height}, {len(pil_images)} frames, {size_mb:.2f} MB")

# =============================================================================
# Animation Scripts
# =============================================================================

hero_anim_script = """function(svg, t, frame, total) {
    const prog = frame / total;

    // 1. Orbital Ring Satellites
    const sat1 = svg.querySelector('g[transform="translate(885, 195)"] g[transform="rotate(-28)"] circle[cx="145"]');
    const sat1Glow = svg.querySelector('g[transform="translate(885, 195)"] g[transform="rotate(-28)"] circle[r="6"]');
    if (sat1) {
        const ang1 = 2 * Math.PI * prog;
        const x1 = (145 * Math.cos(ang1)).toFixed(1);
        const y1 = (52 * Math.sin(ang1)).toFixed(1);
        sat1.setAttribute('cx', x1);
        sat1.setAttribute('cy', y1);
        if (sat1Glow) {
            sat1Glow.setAttribute('cx', x1);
            sat1Glow.setAttribute('cy', y1);
            sat1Glow.setAttribute('r', (5 + 2 * Math.sin(4 * Math.PI * prog)).toFixed(1));
        }
    }

    const sat2 = svg.querySelector('g[transform="translate(885, 195)"] g[transform="rotate(36)"] circle[cx="-125"]');
    if (sat2) {
        const ang2 = -2 * Math.PI * prog;
        const x2 = (125 * Math.cos(ang2)).toFixed(1);
        const y2 = (44 * Math.sin(ang2)).toFixed(1);
        sat2.setAttribute('cx', x2);
        sat2.setAttribute('cy', y2);
    }

    const sat3 = svg.querySelector('g[transform="translate(885, 195)"] circle[cy="32"]');
    if (sat3) {
        const ang3 = 4 * Math.PI * prog;
        const x3 = (95 * Math.cos(ang3)).toFixed(1);
        const y3 = (32 * Math.sin(ang3)).toFixed(1);
        sat3.setAttribute('cx', x3);
        sat3.setAttribute('cy', y3);
    }

    // 2. 3D Hypercube Heave and Singularity Pulse
    const hypercube = svg.querySelector('#hypercubeCore');
    if (hypercube) {
        const heaveY = (-4 + 8 * Math.sin(2 * Math.PI * prog)).toFixed(1);
        hypercube.setAttribute('transform', `translate(0, ${heaveY})`);
    }
    const singularity = svg.querySelector('#hypercubeCore circle[cx="0"][cy="0"]');
    if (singularity) {
        const rad = (3.2 + 1.6 * (0.5 + 0.5 * Math.sin(4 * Math.PI * prog))).toFixed(1);
        singularity.setAttribute('r', rad);
    }

    // 3. Specular Light Sweep Gradient
    const sweepGrad = svg.querySelector('#typogSweep');
    if (sweepGrad) {
        const sweepX1 = (-100 + 300 * prog).toFixed(1) + '%';
        const sweepX2 = (0 + 300 * prog).toFixed(1) + '%';
        sweepGrad.setAttribute('x1', sweepX1);
        sweepGrad.setAttribute('x2', sweepX2);
    }

    // 4. Peripheral Nodes Blink
    const dots = svg.querySelectorAll('g[transform="translate(885, 195)"] g[transform^="translate("] circle[r="2.5"]');
    dots.forEach((dot, idx) => {
        const shift = idx * 0.25;
        const op = (0.4 + 0.6 * (0.5 + 0.5 * Math.cos(2 * Math.PI * (prog * 2 + shift)))).toFixed(2);
        dot.setAttribute('opacity', op);
    });

    // 5. Header Beacon Blink
    const beacon = svg.querySelector('g[font-size="9"] text tspan');
    if (beacon) {
        const bOp = (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(4 * Math.PI * prog))).toFixed(2);
        beacon.setAttribute('opacity', bOp);
    }
}"""

projects_anim_script = """function(svg, t, frame, total) {
    const prog = frame / total;
    const cards = svg.querySelectorAll('g[transform^="translate("] rect[stroke="#00FF88"], g[transform^="translate("] rect[stroke="#00D9FF"], g[transform^="translate("] rect[stroke="#8B5CF6"]');
    cards.forEach((card, idx) => {
        const shift = idx * 0.2;
        const s = 0.5 + 0.5 * Math.sin(2 * Math.PI * (prog * 2 + shift));
        card.setAttribute('stroke-opacity', (0.5 + 0.5 * s).toFixed(2));
    });

    const statusDots = svg.querySelectorAll('circle[r="3.5"], circle[r="3"]');
    statusDots.forEach((dot, idx) => {
        const shift = idx * 0.3;
        const op = (0.35 + 0.65 * (0.5 + 0.5 * Math.cos(2 * Math.PI * (prog * 3 + shift)))).toFixed(2);
        dot.setAttribute('opacity', op);
    });
}"""

try:
    print("=== RENDERING HIGH-FIDELITY ANIMATED GIFS ===")
    
    # 1. hero-motion.gif (1200x380, 18fps, 2.0s = 36 frames)
    render_gif_asset("hero-motion.svg", "hero-motion.gif", 1200, 380, 36, 18, hero_anim_script)

    # 2. projects-motion.gif (1200x580, 18fps, 2.0s = 36 frames)
    render_gif_asset("projects.svg", "projects-motion.gif", 1200, 580, 36, 18, projects_anim_script)

    print("\n=== GIF RENDERING COMPLETE ===")
finally:
    server.shutdown()
