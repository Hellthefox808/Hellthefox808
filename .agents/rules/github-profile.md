# GitHub Profile Architectural Rules & Governance Invariants

## 1. Architectural Scope & Repository Invariants

This specification establishes the non-negotiable architectural constraints, design token definitions, content verification invariants, and quality gates for the GitHub Profile repository of **Ravi Ranjan Singh (`Hellthefox808`)**.

Every agent, developer, and automated pipeline modifying this repository must strictly conform to these rules.

---

## 2. Core Repository Governance Rules

### 2.1 Zero-Dependency Root Contract
To guarantee maximum portability, security, and instantaneous cloning, the repository root must remain completely unpolluted:
1. **Forbidden Artifacts in Root**:
   - `node_modules/`, `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`
   - `Cargo.toml`, `Cargo.lock`
   - `pom.xml`, `build.gradle`, `gradlew`
   - Compiled binary objects (`*.exe`, `*.dll`, `*.so`, `*.dylib`)
   - Temporary caches (`__pycache__/`, `.pytest_cache/`, `.turbo/`)
2. **Runtime Policy**: All tooling in `scripts/` must rely strictly on standard runtime libraries (Python 3.10+ standard library).

### 2.2 Relative Path & Filesystem Traversal Invariants
1. **POSIX Forward-Slash Invariant**: Every file reference in Markdown, HTML, and SVG files must strictly utilize forward slashes (`/`). Windows backslashes (`\`) are strictly forbidden in URIs.
2. **Directory Traversal Boundary Escapes**: Relative paths must never use `../` to escape the repository root boundary.
3. **Linux Filesystem Case Sensitivity**: All paths must match the exact case of filenames and directories on disk. Mixed-case references (e.g. `Assets/Hero.svg` referencing `assets/hero.svg`) will trigger a hard test failure.
4. **Positive File Size Constraint**: Referenced assets must exist on disk and possess a strictly positive file size (`st_size > 0`). Zero-byte stub files are rejected.

### 2.3 W3C Vector Standards & Security Sanitization
1. **XML Well-Formedness**: All `.svg` files must parse cleanly without errors via W3C-compliant XML parsers (`xml.etree.ElementTree`).
2. **Root SVG Namespace**: The root element must be `<svg>` with explicit namespace declaration `xmlns="http://www.w3.org/2000/svg"`.
3. **Numeric Positive ViewBox**: Every SVG must define a valid `viewBox="min-x min-y width height"` attribute containing 4 numerical coordinates where `width > 0` and `height > 0`.
4. **Zero Script & ForeignObject Injection**: SVGs must contain zero `<script>` elements, zero `onload`/`onclick` attributes, and zero `<foreignObject>` tags to ensure safe rendering through GitHub Camo and web browsers.

---

## 3. Design Token Architecture & Palettes

All vector graphics, interactive canvas engines, and UI documentation must adhere strictly to the cyber-engineering design token system:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ CYBER-ENGINEERING DESIGN TOKEN SYSTEM                                                  │
├─────────────────┬──────────┬────────────────────────┬──────────────────────────────────┤
│ Token Name      │ Hex Code │ RGB Normalized         │ Functional Role                  │
├─────────────────┼──────────┼────────────────────────┼──────────────────────────────────┤
│ bg-void         │ #05080B  │ rgb(5, 8, 11)          │ Deep obsidian canvas & vignette  │
│ bg-canvas       │ #0A0C10  │ rgb(10, 12, 16)        │ Primary SVG container background │
│ bg-surface      │ #0D1117  │ rgb(13, 17, 23)        │ Secondary dark surface (GitHub)  │
│ accent-emerald  │ #00FF88  │ rgb(0, 255, 136)       │ Primary accent: nodes, circuits  │
│ accent-cyan     │ #00E5FF  │ rgb(0, 229, 255)       │ High-contrast electric cyan      │
│ accent-cybercyan│ #00D9FF  │ rgb(0, 217, 255)       │ Secondary accent: telemetry bus  │
│ accent-violet   │ #8B5CF6  │ rgb(139, 92, 246)      │ Tertiary accent: cloud, infra    │
│ accent-purple   │ #9875FF  │ rgb(152, 117, 255)     │ Supporting violet quantum glow   │
│ text-pure       │ #FFFFFF  │ rgb(255, 255, 255)     │ H1 headings, vital metrics       │
│ text-primary    │ #F5F7FA  │ rgb(245, 247, 250)     │ Primary titles, active labels    │
│ text-secondary  │ #AAB7C4  │ rgb(170, 183, 196)     │ Body descriptions, explanations  │
│ text-muted      │ #7E92A2  │ rgb(126, 146, 162)     │ Secondary telemetry, subtitles   │
│ border-glow     │ #00FF88  │ rgba(0, 255, 136, 0.4) │ Elevated card border stroke      │
│ border-subtle   │ #30363D  │ rgba(48, 54, 61, 0.6)  │ Structural frame outline         │
└─────────────────┴──────────┴────────────────────────┴──────────────────────────────────┘
```

### Contrast Invariants (WCAG AAA)
Against the `#05080B` obsidian background:
- `accent-emerald` (`#00FF88`): Relative luminance 0.655 $\rightarrow$ Contrast ratio **14.1:1** (Exceeds WCAG AAA $\ge 7:1$).
- `accent-cyan` (`#00D9FF`): Relative luminance 0.618 $\rightarrow$ Contrast ratio **13.4:1** (Exceeds WCAG AAA $\ge 7:1$).
- `text-primary` (`#F5F7FA`): Relative luminance 0.945 $\rightarrow$ Contrast ratio **19.9:1** (Exceeds WCAG AAA $\ge 7:1$).
- `accent-violet` (`#8B5CF6`): Relative luminance 0.231 $\rightarrow$ Contrast ratio **5.6:1** (Exceeds WCAG AA $\ge 4.5:1$).

---

## 4. Multi-Tier Asset Parity Rules

Every major visual banner must be provided across 4 synchronized tiers to guarantee deterministic rendering across all platforms:

1. **Tier 1: Standalone Vector SVG (`assets/*.svg`)**: Pure XML vector asset for modern browsers and high-DPI displays.
2. **Tier 2: Declarative Motion SVG (`assets/motion/*-motion.svg`)**: Hardware-accelerated SMIL `<animate>` and CSS `@keyframes` loops for vector-motion-capable environments.
3. **Tier 3: Animated GIF Display Asset (`assets/animated/*-motion.gif`)**: 18fps seamless loop render for mobile apps and markdown viewers that disable SVG SMIL animations.
4. **Tier 4: Static High-DPI PNG Fallback (`assets/static/*.png`)**: 2x retina rasterized fallback for legacy or constrained environments.

### Supported Aspect Ratios
- Hero Banner (`hero.svg`): 1200 × 380 (Aspect Ratio: 3.158)
- Architecture Diagram (`architecture.svg`): 1200 × 480 (Aspect Ratio: 2.500)
- Areas of Expertise (`expertise.svg`): 1200 × 540 (Aspect Ratio: 2.222)
- Featured Projects (`projects.svg`): 1200 × 580 (Aspect Ratio: 2.069)
- Engineering Footer (`footer.svg`): 1200 × 220 (Aspect Ratio: 5.455)
- Telemetry Divider (`divider.svg`): 1200 × 24 (Aspect Ratio: 50.000)

---

## 5. Content Verification & Anti-Fabrication Invariants

### 5.1 Factual Grounding Policy
All claims, statistics, role titles, and academic milestones must be strictly grounded in verified records. Zero fabricated metrics are permitted.

### 5.2 Canonical Repository Invariants
All featured projects must trace to genuine, verified repositories under `https://github.com/Hellthefox808`:
1. `Hellthefox808/ShiVi-D`: AI-Native B2B RevOps & Multi-Agent Control Plane (**471** passing Vitest assertions across 167 suites).
2. `Hellthefox808/NCC-CRM-V1.0`: High-Assurance Cadet Lifecycle Command Centre for **19 Jharkhand** Battalion NCC (Bounded LRU Cache `MAX_MEMORY_ITEMS = 5000`, salted scrypt, UIDAI Verhoeff $D_5$ algorithm).
3. `Hellthefox808/ShiVi-AI-Offline-First-Multilingual-Education-Platform`: BhashaSetu AI offline-first tribal education platform.
4. `Hellthefox808/agri-tech-2..0`: AIoT precision agriculture telemetry guardian.
5. `Hellthefox808/Travel-v1.1.2-Buget`: Travel Nest budgeting and expense forecasting engine.
6. `Hellthefox808/Expense-tracker`: Glassmorphic financial telemetry dashboard.

### 5.3 Verified Academic & Leadership Credentials
- **Degree**: Bachelor of Technology (B.Tech) in Computer Science & Engineering (2023–2027), Sarala Birla University (SBU), Ranchi.
- **Foundational Education**: Army Public School (APS) (2011–2021) and L. A. Garden High School (2021–2023).
- **Military Leadership**: National Cadet Corps (NCC) — **19 Jharkhand** Battalion NCC, holding the rank of **Sergeant** (SGT).
- **Military Distinction**: **Best Cadet Award (2019)** — 19 Jharkhand Battalion NCC, and NCC Meritorious Cadet Scholarship.
- **Athletic Rank**: **Black Belt (1st Dan) in Taekwondo** and competitive Judo experience.
- **Industry Certifications**: Verified Cisco Networking Academy & AWS credentials (CCNA Trilogy: ITN, SRWE, ENSA; Cisco Security; AWS AI Governance; Python Essentials; Data Science).

---

## 6. Markdown Hygiene & Quality Assurance

1. **Monotonic Heading Progression**: Every Markdown document must maintain valid heading hierarchy: $D_{curr} \le D_{prev} + 1$.
2. **HTML Container Tag Balance**: Every opened HTML container tag (`<div>`, `<table>`, `<tr>`, `<td>`, `<picture>`) must have an exact closing tag. Self-closing container tags (e.g. `<div />`) are strictly prohibited in GFM.
3. **Accessibility Standards**: Every image tag (`<img>` and `![]()`) must declare a non-empty `alt` attribute ($\ge 4$ characters) free of placeholder tokens (`TODO`, `TBD`, `placeholder`).
4. **HTTPS Enforcement**: All external hyperlinks must strictly use the `https://` protocol or `mailto:`. Insecure `http://` links are strictly forbidden.

---

*Authored by AG-0-04-1 [Documentation Architect & Systems Governance Specialist] under ANTARES-10K Swarm Governance.*
