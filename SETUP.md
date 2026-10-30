# Developer Setup, Local Preview & Deployment Manual

## 1. Executive Overview & System Architecture

This repository contains the complete production-grade GitHub Profile README ecosystem for **Ravi Ranjan Singh (`Hellthefox808`)**. The project is engineered as a zero-dependency, self-contained system combining:
1. **Master 12-Section Profile README (`README.md`)**: Formatted for GitHub Flavored Markdown (GFM) with verified credentials and telemetry.
2. **Multi-Tier Visual Asset Suite (`assets/`)**: Standalone XML/SVGs, declarative SMIL/CSS motion SVGs, 18fps seamless loop GIFs, static 2x PNG fallbacks, and custom SVG metric cards.
3. **Interactive Motion Preview (`motion-preview/`)**: A standalone client-side HTML5 Canvas and 3D parallax particle simulation requiring zero external libraries or build tools.
4. **4-Tier Automated Verification Suite (`scripts/verify.py`)**: An end-to-end testing harness validating XML well-formedness, link integrity, asset parity, WCAG contrast, and Linux case sensitivity.
5. **Governance & Documentation Suite (`docs/`, root)**: Comprehensive architectural charters, design tokens, and forensic verification ledgers.

---

## 2. Directory Layout & Asset Manifest

```text
ravi-github-profile/
├── .agents/
│   ├── rules/
│   │   └── github-profile.md       # Architectural constraints, tokens & content rules
│   └── teamwork/                   # Multi-agent persistent memory & progress logs
├── assets/
│   ├── hero.svg                    # Core cybernetic hero banner (1200x380)
│   ├── expertise.svg               # Areas of expertise & taxonomy (1200x540)
│   ├── architecture.svg            # Systems architecture blueprint (1200x480)
│   ├── projects.svg                # Flagship featured projects card (1200x580)
│   ├── footer.svg                  # Cybernetic telemetry footer (1200x220)
│   ├── divider.svg                 # Glowing neon telemetry separator (1200x24)
│   ├── analytics-fallback.svg      # Unified static telemetry fallback panel
│   ├── motion/                     # Declarative SMIL / CSS keyframe motion SVGs
│   │   ├── hero-motion.svg
│   │   ├── expertise-motion.svg
│   │   ├── architecture-motion.svg
│   │   ├── particles-motion.svg
│   │   └── footer-motion.svg
│   ├── animated/                   # 18fps seamless loop animated GIFs
│   │   ├── hero-motion.gif
│   │   ├── expertise-motion.gif
│   │   ├── architecture-motion.gif
│   │   └── footer-motion.gif
│   └── static/                     # High-DPI 2x static PNG fallbacks & SVG stat cards
│       ├── hero.png
│       ├── expertise.png
│       ├── architecture.png
│       ├── footer.png
│       ├── github-stats.svg
│       ├── top-langs.svg
│       └── streak-stats.svg
├── docs/
│   ├── design-system.md            # Design tokens, color swatches & visual standards
│   ├── content-verification.md     # Forensic audit ledger of all verified claims
│   └── deployment-guide.md         # GitHub Special Repo & Camo proxy deployment
├── motion-preview/
│   ├── index.html                  # Standalone interactive preview stage
│   ├── styles.css                  # Obsidian glassmorphic styling
│   └── motion.js                   # Interactive particle constellation engine
├── scripts/
│   └── verify.py                   # 4-tier automated verification harness
├── README.md                       # Master 12-section GitHub Profile README
├── AGENTS.md                       # Multi-agent swarm architecture & governance
└── SETUP.md                        # Developer setup, testing & deployment guide
```

---

## 3. Environment Prerequisites

This repository adheres to a strict **Zero-Pollution & Zero-Dependency Root Contract**. No Node.js runtime, npm packages, Rust toolchains, or heavy bundlers are required in the project root.

### Required Software
- **Python**: Version 3.10 or later (standard library only: `xml.etree.ElementTree`, `re`, `pathlib`, `json`, `argparse`, `time`, `urllib.parse`).
- **Web Browser**: Any modern evergreen browser (Google Chrome, Mozilla Firefox, Microsoft Edge, or Apple Safari) supporting HTML5 Canvas and CSS variables.
- **Git**: Version 2.30 or higher for version control and remote deployment.

---

## 4. Automated Verification Test Harness

The primary quality assurance gate is `scripts/verify.py`. It executes 60 rigorous automated tests categorized into 4 distinct verification tiers.

### Running the Verification Harness

To execute the entire 4-tier verification suite:
```bash
python scripts/verify.py --all
```

To execute specific tiers selectively:
```bash
# Tier 1: Feature Coverage (XML/SVG validity, 12 sections, file existence)
python scripts/verify.py --tier 1

# Tier 2: Boundary & Corner Cases (Alt text quality, Linux case sensitivity, tag balance)
python scripts/verify.py --tier 2

# Tier 3: Cross-Feature Integration (4-way asset parity, aspect ratios, docs sync)
python scripts/verify.py --tier 3

# Tier 4: Real-World Scenarios (CDN independence, GFM whitespace, WCAG contrast)
python scripts/verify.py --tier 4
```

### Advanced CLI Options
- `--verbose`: Enable detailed per-assertion diagnostic logs.
- `--json-report <output-path>`: Export machine-readable test execution metrics in JSON format for CI/CD ingestion:
  ```bash
  python scripts/verify.py --all --json-report test-report.json
  ```

### Verification Tier Taxonomy Breakdown

#### Tier 1: Feature Coverage (Structural & Syntactic Validity)
- **SVG XML Well-Formedness**: Validates all vector files in `assets/`, `assets/motion/`, and `assets/static/` via XML element tree parsing.
- **W3C Namespace & Root Validation**: Enforces root `<svg>` tag with valid namespace `xmlns="http://www.w3.org/2000/svg"`.
- **Numeric ViewBox Invariants**: Ensures positive numerical ViewBox boundaries and prevents `<script>` or `<foreignObject>` injection.
- **README 12-Section Monotonic Progression**: Confirms unbroken sequential presence from Hero Banner through Contact & Footer.
- **Asset Existence**: Asserts disk presence and positive file size (`st_size > 0`) for all 22 core and fallback assets.

#### Tier 2: Boundary & Corner Cases (Defensive Robustness)
- **Accessibility & Alt Text Completeness**: Guarantees every image possesses descriptive alt text ($\ge 4$ characters) free of banned placeholder tokens (`TODO`, `TBD`, `placeholder`).
- **Linux Filesystem Case Sensitivity**: Simulates case-sensitive Linux filesystem traversal over all relative links to prevent 404 errors on GitHub's Linux hosting nodes.
- **Heading Hierarchy Monotonicity**: Enforces depth step invariant ($D_{curr} \le D_{prev} + 1$) preventing skipped heading levels.
- **HTML Container Balancing**: Validates exact opening and closing tag balance for container elements (`<div>`, `<table>`, `<tr>`, `<td>`, `<picture>`).
- **URL Security & Protocol Enforcement**: Mandates strict `https://` protocol on all external links; eliminates unescaped whitespace and non-POSIX backslashes.

#### Tier 3: Cross-Feature Integration & Fallback Parity
- **4-Way Asset Parity Matrix**: Verifies that every core visual banner (`hero`, `expertise`, `architecture`, `projects`, `footer`) has its corresponding Standalone SVG, Motion SVG, Animated GIF, and Static PNG.
- **Aspect Ratio Consistency**: Calculates ViewBox width-to-height ratio against PNG IHDR binary header dimensions, ensuring deviation remains $\le 5\%$.
- **Analytics Fallback Cohesion**: Asserts that dynamic telemetry badges are backed by static vector fallback protection.
- **Content & Evidence Synchronization**: Cross-verifies project URLs, Vitest assertion counts (`471`), cache bounds (`5000`), military battalion (`19 Jharkhand`), and rank (`Sergeant`) between `README.md` and `docs/content-verification.md`.

#### Tier 4: Real-World Scenarios & Rendering Simulation
- **Standalone CDN Independence**: Confirms the interactive motion preview operates completely offline without external CDN dependencies.
- **GFM Block Whitespace Isolation**: Enforces GitHub Flavored Markdown block-level spacing around tables and code fences.
- **WCAG AAA Color Contrast**: Mathematically calculates relative luminance and contrast ratios against `#05080B` to ensure compliance with WCAG AAA standards ($\ge 7.0:1$).
- **Responsive Dimensions**: Ensures major visual banners declare responsive `width="100%"` attributes for mobile and 4K displays.

---

## 5. Standalone Interactive Motion Preview

The `motion-preview/` directory contains an interactive, browser-executable visual showcase demonstrating the particle constellation engine, real-time mouse parallax depth, and cyber-engineering HUD aesthetics.

### How to Launch the Motion Preview

1. **Direct Browser Execution**:
   - Navigate to `motion-preview/index.html` in your operating system's file explorer.
   - Double-click `index.html` or drag it into any open browser window.
2. **Local HTTP Server (Optional)**:
   - In terminal, start Python's built-in HTTP server:
     ```bash
     python -m http.server 8000
     ```
   - Open your browser to the local port serving `motion-preview/index.html`.

### Interactive Controls & Features
- **Mouse Parallax**: Move the cursor across the canvas to apply real-time 3D camera perspective shifts and dynamic particle displacement.
- **Dynamic Node Constellation**: Particles calculate inter-node distance and render dynamic linking vectors when within proximity thresholds.
- **Glassmorphic Reticle Cards**: Inspect visual cards rendering cyber-engineering telemetry with high-contrast text and glowing borders.
- **Adaptive Canvas Resizing**: Automatically recalibrates particle density and canvas resolution on window resize events.

---

## 6. Inspecting Visual Assets & Fallbacks

All visual assets follow strict ViewBox aspect ratios and design token specifications:

| Asset Identifier | File Path | ViewBox / Dims | Purpose & Rendering Behavior |
|---|---|---|---|
| Hero Banner | `assets/hero.svg` | 1200 × 380 | Primary profile introduction, agent topology, and HUD status reticles. |
| Expertise Taxonomy | `assets/expertise.svg` | 1200 × 540 | 4-column capability taxonomy: AI, Backend, Cloud, and Security. |
| Systems Architecture | `assets/architecture.svg` | 1200 × 480 | Distributed control plane, RAG pipeline, and dual-cache architecture. |
| Featured Projects | `assets/projects.svg` | 1200 × 580 | Flagship engineering projects matrix with architectural highlights. |
| Telemetry Footer | `assets/footer.svg` | 1200 × 220 | Terminal node signature, cryptography hash, and status indicators. |
| Telemetry Divider | `assets/divider.svg` | 1200 × 24 | High-contrast neon green separator line with glowing center node. |
| Hero Motion SVG | `assets/motion/hero-motion.svg` | 1200 × 380 | Declarative SMIL / CSS keyframe pulsing nodes and conduit flows. |
| Hero Animated GIF | `assets/animated/hero-motion.gif` | 1200 × 380 | 18fps seamless loop render for environments suppressing SVG SMIL. |
| Hero Static PNG | `assets/static/hero.png` | 2400 × 760 (2x) | High-DPI rasterized fallback for legacy or offline viewers. |

---

## 7. Deploying to GitHub Profile

To display this profile README on your public GitHub page, it must be published to a special repository whose name exactly matches your GitHub username: **`Hellthefox808`**.

### Step 1: Initialize Git Repository
In the root directory of this repository:
```bash
git init
```

### Step 2: Configure Git Remote
Ensure your remote URL points to the special repository:
```bash
git remote add origin https://github.com/Hellthefox808/Hellthefox808.git
```

### Step 3: Stage and Commit Production Deliverables
Stage all production files, documentation, and vector assets:
```bash
git add README.md AGENTS.md SETUP.md .agents/ assets/ docs/ motion-preview/ scripts/
git commit -m "feat(profile): deploy production cyber-engineering profile README and multi-tier visual asset suite"
```

### Step 4: Set Main Branch & Push
Set the default branch to `main` and push to GitHub:
```bash
git branch -M main
git push -u origin main --force
```

### Step 5: Post-Deployment Verification
1. Open `https://github.com/Hellthefox808` in an incognito or fresh browser window.
2. Confirm all 12 sequential sections render with proper typography, tables, and asset linkages.
3. Verify that GitHub Camo (`camo.githubusercontent.com`) successfully proxies all SVG banners without visual clipping.
4. Confirm telemetry badges (Profile Views, LinkedIn, Status) return HTTP 200.

---

*Authored by AG-0-04-1 [Documentation Architect & Systems Governance Specialist] under ANTARES-10K Swarm Governance.*
