import os
import subprocess
from PIL import Image

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ASSETS_DIR = os.path.join(PROJECT_ROOT, "assets")
STATIC_DIR = os.path.join(ASSETS_DIR, "static")

os.makedirs(STATIC_DIR, exist_ok=True)

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
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        f"--window-size={width},{height}",
        f"--screenshot={temp_png}",
        f"file:///{temp_html.replace(os.sep, '/')}"
    ]
    subprocess.run(cmd, check=True, capture_output=True)

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

