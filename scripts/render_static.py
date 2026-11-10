#!/usr/bin/env python3
"""
High-Resolution Static PNG Asset Renderer
=========================================
Renders 2x high-DPI static PNG fallbacks for all standalone SVG assets using
a headless Chromium/Chrome/Edge browser instance.
"""

import os
import shutil
import subprocess
import sys
from PIL import Image


def find_browser() -> str | None:
    """Locate Google Chrome, Chromium, or Microsoft Edge across OS platforms."""
    # 1. User-supplied environment variable override
    env_override = os.getenv("CHROME_PATH") or os.getenv("BROWSER_PATH")
    if env_override and os.path.isfile(env_override):
        return env_override

    # 2. Check system PATH
    for candidate in ["google-chrome", "chromium", "chromium-browser", "chrome", "msedge"]:
        path = shutil.which(candidate)
        if path:
            return path

    # 3. Platform-specific fallback paths
    if sys.platform == "win32":
        candidates = [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
            r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        ]
    elif sys.platform == "darwin":
        candidates = [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Chromium.app/Contents/MacOS/Chromium",
            "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        ]
    else:  # Linux / Unix
        candidates = [
            "/usr/bin/google-chrome",
            "/usr/bin/google-chrome-stable",
            "/usr/bin/chromium",
            "/usr/bin/chromium-browser",
            "/snap/bin/chromium",
        ]

    for p in candidates:
        if os.path.isfile(p):
            return p

    return None


PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ASSETS_DIR = os.path.join(PROJECT_ROOT, "assets")
STATIC_DIR = os.path.join(ASSETS_DIR, "static")

os.makedirs(STATIC_DIR, exist_ok=True)

browser_path = find_browser()
if not browser_path:
    print("[ERROR] No supported headless browser (Chrome/Chromium/Edge) found on system.")
    print("Please set the CHROME_PATH environment variable to your browser executable.")
    sys.exit(1)

print(f"[ENGINE] Using browser: {browser_path}")

targets = [
    ("hero.svg", "hero.png", 1200, 380),
    ("expertise.svg", "expertise.png", 1200, 540),
    ("architecture.svg", "architecture.png", 1200, 480),
    ("projects.svg", "projects.png", 1200, 580),
    ("footer.svg", "footer.png", 1200, 220),
]

for svg_name, png_name, width, height in targets:
    svg_path = os.path.join(ASSETS_DIR, svg_name)
    out_png = os.path.join(STATIC_DIR, png_name)
    temp_html = os.path.join(STATIC_DIR, f"temp_{png_name}.html")

    if not os.path.exists(svg_path):
        print(f"[SKIP] Source SVG not found: {svg_path}")
        continue

    with open(svg_path, "r", encoding="utf-8") as f:
        svg_xml = f.read()

    html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
html, body {{ width: {width}px; height: {height}px; overflow: hidden; background: #05080B; }}
svg {{ display: block; width: {width}px; height: {height}px; }}
</style>
</head>
<body>
{svg_xml}
</body>
</html>"""

    with open(temp_html, "w", encoding="utf-8") as f:
        f.write(html_content)

    temp_png = os.path.join(STATIC_DIR, f"raw_{png_name}")
    cmd = [
        browser_path,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        f"--window-size={width},{height}",
        f"--screenshot={temp_png}",
        f"file:///{temp_html.replace(os.sep, '/')}"
    ]
    try:
        subprocess.run(cmd, check=True, capture_output=True, timeout=30)
    finally:
        if os.path.exists(temp_html):
            os.remove(temp_html)

    if os.path.exists(temp_png):
        with Image.open(temp_png) as im:
            cropped = im.crop((0, 0, width, height))
            cropped.save(out_png, format="PNG", optimize=True)
        os.remove(temp_png)
        size_kb = os.path.getsize(out_png) / 1024
        print(f"[RENDERED] {png_name}: {width}x{height}, {size_kb:.1f} KB")
    else:
        print(f"[ERROR] Failed to generate {png_name}")
