# Automated Verification & E2E Testing Infrastructure

**Author:** AG-0-04-8 [E2E Testing Architect & Test Writer]  
**Location:** `scripts/verify.py`  
**Test Suite Standard:** 4-Tier Opaque-Box E2E Testing Taxonomy  
**Dependency Footprint:** Standard Library Only (Python 3.10+) — Zero External Dependencies  

---

## 1. Architectural Philosophy & Principles

The testing harness in `scripts/verify.py` provides opaque-box verification for Ravi Ranjan Singh's GitHub Profile README and multi-tier visual engineering asset suite.

The test infrastructure operates under three foundational engineering principles:

1. **Zero-Dependency Guarantee**: The verification harness relies exclusively on Python standard libraries (`xml.etree.ElementTree`, `re`, `pathlib`, `struct`, `urllib.parse`, `argparse`, `json`, `time`, `os`, `sys`). No third-party packages (`pip`, `npm`, `cargo`) are required, ensuring instant execution across local developer workstations, air-gapped environments, and CI/CD runners.
2. **Opaque-Box Behavioral Validation**: The suite treats the repository as an external artifact, verifying observable contracts: XML well-formedness, W3C namespaces, GFM markdown rendering quirks, POSIX case-sensitive filesystem pathing, WCAG 2.1 AAA color contrast ratios, binary PNG dimensions, and evidence synchronization.
3. **Machine-Verifiable Gate Contract**: All tests yield deterministic boolean pass/fail verdicts with explicit error diagnostics. Any violation produces an exit code of `1`, serving as a blocking quality gate for local git pre-commit hooks and GitHub Actions CI pipelines.

---

## 2. 4-Tier E2E Testing Taxonomy Matrix

The verification harness implements a **4-Tier Testing Taxonomy** comprising 60 granular test cases:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 4-TIER E2E VERIFICATION SUITE TAXONOMY                                                           │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│  [TIER 1] FEATURE COVERAGE (25 Tests)                                                            │
│  ├── Category 1: XML/SVG Validity & Schema (5 Tests)                                             │
│  ├── Category 2: README 12-Section Architecture & Sequence (5 Tests)                              │
│  ├── Category 3: Asset & File Existence (5 Tests)                                                │
│  ├── Category 4: Repository Governance & Documentation (5 Tests)                                 │
│  └── Category 5: Interactive Motion Preview Files (5 Tests)                                      │
│                                                                                                  │
│  [TIER 2] BOUNDARY & CORNER CASES (25 Tests)                                                     │
│  ├── Category 1: Image Alt Text & Link Attributes (5 Tests)                                      │
│  ├── Category 2: Local Relative Path Resolution & Linux Case-Sensitivity (5 Tests)               │
│  ├── Category 3: Heading Hierarchy & Depth Invariants (5 Tests)                                  │
│  ├── Category 4: HTML Tag Pairing & Sanitizer Safety (5 Tests)                                   │
│  └── Category 5: URL Protocol & Security (5 Tests)                                               │
│                                                                                                  │
│  [TIER 3] CROSS-FEATURE INTEGRATION & FALLBACKS (5 Tests)                                        │
│  ├── Test 3.1: Core 4-Way Multi-Tier Asset Parity (SVG, Motion, GIF, PNG)                        │
│  ├── Test 3.2: Aspect Ratio Consistency between SVG ViewBox and PNG Header                      │
│  ├── Test 3.3: Live Analytics Card & Static SVG Fallback Cohesion                                │
│  ├── Test 3.4: Canonical Project URLs Parity with docs/content-verification.md                  │
│  └── Test 3.5: Key Technical Metrics & Credential Synchronization                                │
│                                                                                                  │
│  [TIER 4] REAL-WORLD SCENARIOS & RENDERING SIMULATION (5 Tests)                                  │
│  ├── Test 4.1: Motion Preview Standalone CDN Independence (Zero Remote Scripts)                  │
│  ├── Test 4.2: GitHub Flavored Markdown (GFM) Block Isolation & Whitespace Hygiene               │
│  ├── Test 4.3: Dark-Mode WCAG AAA Relative Luminance & Contrast Ratios                          │
│  ├── Test 4.4: Cross-Platform POSIX Path Invariant (Zero Windows Backslashes)                    │
│  └── Test 4.5: Responsive Viewport & Dimension Declarations                                      │
│                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Comprehensive Tier Coverage Breakdown

### Tier 1: Feature Coverage (25 Tests)
| Test ID | Category | Name | Authoritative Specification |
|---|---|---|---|
| `T1.1.1` | SVG Validity | Standalone SVG XML Well-Formedness | Parses every SVG in `assets/` via `xml.etree.ElementTree`. Rejects malformed markup. |
| `T1.1.2` | SVG Validity | Root SVG Element & XML Namespace | Verifies root element is `svg` and declares `xmlns="http://www.w3.org/2000/svg"`. |
| `T1.1.3` | SVG Validity | ViewBox Attribute Presence & Format | Verifies `viewBox` attribute matches numeric coordinate syntax `min-x min-y width height`. |
| `T1.1.4` | SVG Validity | SVG Dimensions Positivity | Asserts viewBox width > 0 and height > 0, preventing non-renderable SVGs. |
| `T1.1.5` | SVG Validity | Zero Script & ForeignObject Injection | Asserts strictly 0 `<script>` and 0 `<foreignObject>` tags across all SVGs. |
| `T1.2.1` | README Architecture | Hero Banner & Telemetry Header | Verifies `assets/hero.svg` banner reference and telemetry badge links (shields.io, komarev). |
| `T1.2.2` | README Architecture | Core Profile Sections | Verifies presence of About Me, Engineering Focus, and Technical Architecture. |
| `T1.2.3` | README Architecture | Evidence Sections | Verifies presence of Featured Projects, Technology Stack, and GitHub Analytics. |
| `T1.2.4` | README Architecture | Human Dimensions | Verifies presence of Leadership & Community, Certifications & Learning, and Currently Exploring. |
| `T1.2.5` | README Architecture | Terminal Sections & 12-Section Sequence | Verifies strict monotonic ordering of all 12 sequential profile sections. |
| `T1.3.1` | Asset Existence | Core Standalone SVGs in assets/ | Verifies existence of `hero.svg`, `expertise.svg`, `architecture.svg`, `projects.svg`, `footer.svg`, `divider.svg`. |
| `T1.3.2` | Asset Existence | Declarative Motion SVGs in assets/motion/ | Verifies existence of `hero-motion.svg`, `expertise-motion.svg`, `architecture-motion.svg`, `particles-motion.svg`, `footer-motion.svg`. |
| `T1.3.3` | Asset Existence | Animated GIF Display Assets in assets/animated/ | Verifies existence of `hero-motion.gif`, `expertise-motion.gif`, `architecture-motion.gif`, `footer-motion.gif`. |
| `T1.3.4` | Asset Existence | Static 2x PNG Fallbacks in assets/static/ | Verifies existence of `hero.png`, `expertise.png`, `architecture.png`, `footer.png`. |
| `T1.3.5` | Asset Existence | Analytics Fallback Asset Existence | Verifies static SVG fallback cards (`github-stats.svg`, `top-langs.svg`, `streak-stats.svg`) or `analytics-fallback.svg`. |
| `T1.4.1` | Governance Files | Root Governance Files Existence & Non-Empty | Asserts `README.md`, `AGENTS.md`, `SETUP.md`, `.agents/rules/github-profile.md` exist and are non-empty. |
| `T1.4.2` | Governance Files | Visual Design System Documentation | Asserts `docs/design-system.md` exists and defines cyber-engineering design tokens. |
| `T1.4.3` | Governance Files | Forensic Evidence Ledger | Asserts `docs/content-verification.md` exists and documents verified repositories. |
| `T1.4.4` | Governance Files | Deployment Guide | Asserts `docs/deployment-guide.md` exists and provides special profile repository setup. |
| `T1.4.5` | Governance Files | Zero-Pollution Clean Root Contract | Rejects unauthorized package managers, manifests, or build caches in root. |
| `T1.5.1` | Motion Preview | Motion Preview HTML5 Structure & Doctype | Asserts `motion-preview/index.html` contains `<!DOCTYPE html>`. |
| `T1.5.2` | Motion Preview | Motion Preview CSS Styling Linkage | Asserts `motion-preview/styles.css` exists and is linked via `<link rel="stylesheet">`. |
| `T1.5.3` | Motion Preview | Motion Preview JavaScript Engine Linkage | Asserts `motion-preview/motion.js` exists and is loaded via `<script>`. |
| `T1.5.4` | Motion Preview | HTML Canvas Element Declaration | Asserts presence of `<canvas>` viewport for particle and depth rendering. |
| `T1.5.5` | Motion Preview | Animation Loop & Event Listeners | Asserts `requestAnimationFrame` loop and window resize/mouse event handlers in `motion.js`. |

---

### Tier 2: Boundary & Corner Cases (25 Tests)
| Test ID | Category | Name | Authoritative Specification |
|---|---|---|---|
| `T2.1.1` | Image Alt Text | Mandatory Alt Attribute on All Images | Every `<img>` tag and markdown `![]()` must declare an `alt` attribute. |
| `T2.1.2` | Image Alt Text | Non-Empty Alt Text Invariant | Rejects empty `alt=""` or whitespace-only alt text. |
| `T2.1.3` | Image Alt Text | Banned Placeholder Token Filtering | Rejects placeholder tokens (`TODO`, `TBD`, `placeholder`, `untitled`, `screenshot`). |
| `T2.1.4` | Image Alt Text | Descriptive Alt Text Length Threshold | Asserts alt text is $\ge 4$ characters to ensure accessibility compliance. |
| `T2.1.5` | Image Alt Text | Explicit Role Semantics for Dividers | Asserts decorative dividers declare explicit `"Divider"` semantics. |
| `T2.2.1` | Path Resolution | Linux Case-Sensitive Directory Traversal | Simulates POSIX case-sensitivity by matching each segment against actual filesystem entries. |
| `T2.2.2` | Path Resolution | Query Parameter & Fragment Stripping | Verifies separation of `?query` and `#anchor` from local file paths. |
| `T2.2.3` | Path Resolution | Directory Traversal Boundary Escapes | Rejects relative paths containing `../` that attempt to escape repository root. |
| `T2.2.4` | Path Resolution | POSIX Forward-Slash Invariant | Strictly bans Windows backslashes `\` in all relative link attributes. |
| `T2.2.5` | Path Resolution | Zero-Byte Local Target Asset Detection | Rejects references to 0-byte placeholder files. |
| `T2.3.1` | Heading Hierarchy | README Heading Depth Step Invariant | Asserts $D_{curr} \le D_{prev} + 1$ (no jumping e.g. H1 to H3) in `README.md`. |
| `T2.3.2` | Heading Hierarchy | Documentation Suite Heading Depth Invariant | Validates heading monotonicity across all `docs/*.md` files. |
| `T2.3.3` | Heading Hierarchy | Root Level Document Title Governance | Verifies proper top-level document title representation. |
| `T2.3.4` | Heading Hierarchy | No Orphaned Subheadings | Asserts no subheadings appear prior to primary section headings. |
| `T2.3.5` | Heading Hierarchy | Numbered Section Heading Syntax Integrity | Verifies uniform numbering format (`## 01 // ...`) across H2 section titles. |
| `T2.4.1` | HTML Pairing | HTML Container Tag Balance & Nesting | Stack-based validation of container tags (`div`, `table`, `tr`, `td`, `p`, `picture`, `a`). |
| `T2.4.2` | HTML Pairing | Self-Closing Container Tag Rejection | Rejects invalid self-closing container tags (e.g. `<div />`). |
| `T2.4.3` | HTML Pairing | GitHub Sanitizer Forbidden Tag Rejection | Rejects tags stripped by GitHub sanitizer (`<script>`, `<style>`, `<iframe>`, `<object>`). |
| `T2.4.4` | HTML Pairing | Table Row and Cell Balancing | Asserts every `<tr>` contains at least one `<td>` or `<th>` element. |
| `T2.4.5` | HTML Pairing | XML ParseError Exception Safety | Verifies parser resilience against malformed XML structures. |
| `T2.5.1` | URL Security | HTTPS Protocol Enforcement on External URLs | Enforces strict `https://` on all external hyperlinks. |
| `T2.5.2` | URL Security | URI Character Escaping & Whitespace Rejection | Verifies absence of unescaped whitespace characters in URL strings. |
| `T2.5.3` | URL Security | Internal Anchor Fragment Target Integrity | Validates that `#anchor` links resolve to actual GFM-slugified headings. |
| `T2.5.4` | URL Security | External Telemetry Domain Allowlist | Monitors external domains against verified telemetry and badge providers. |
| `T2.5.5` | URL Security | Mailto Protocol URI Syntax | Validates RFC 5322 structure for email communication links. |

---

### Tier 3: Cross-Feature Integration & Fallbacks (5 Tests)
| Test ID | Category | Name | Authoritative Specification |
|---|---|---|---|
| `T3.1.1` | Asset Parity | Core 4-Way Multi-Tier Asset Parity | Verifies that each of the 5 core banners (`hero`, `expertise`, `architecture`, `projects`, `footer`) exists in 4 distinct formats: standalone SVG, motion SVG, animated GIF, and static PNG. |
| `T3.2.1` | Aspect Ratio | ViewBox vs Static PNG Header Aspect Ratio | Parses SVG `viewBox` and reads binary PNG IHDR chunk dimensions (bytes 16-24) to assert aspect ratio match within 5% tolerance. |
| `T3.3.1` | Analytics Fallback | Live Stats Card & Static SVG Fallback Cohesion | Verifies that GitHub analytics telemetry includes static fallback cards or `assets/analytics-fallback.svg` for offline resilience. |
| `T3.4.1` | Content Cross-Check | Canonical Project URLs Parity with docs | Verifies all 6 canonical repositories (`ShiVi-D`, `NCC-CRM-V1.0`, `ShiVi-AI-Offline-First-Multilingual-Education-Platform`, `agri-tech-2..0`, `Travel-v1.1.2-Buget`, `Expense-tracker`) are synchronized between `README.md` and `docs/content-verification.md`. |
| `T3.5.1` | Credential Cross-Check | Key Metrics & Credentials Synchronization | Verifies quantitative metrics (`471` assertions, `MAX_MEMORY_ITEMS = 5000`, `19 Jharkhand Bn NCC`, `Sergeant`, `Best Cadet (2019)`) match between `README.md` and `docs/content-verification.md`. |

---

### Tier 4: Real-World Scenarios & Rendering Simulation (5 Tests)
| Test ID | Category | Name | Authoritative Specification |
|---|---|---|---|
| `T4.1.1` | Motion Engine | Motion Preview Standalone CDN Independence | Verifies that `motion-preview/index.html` loads zero external scripts, ensuring completely offline operation. |
| `T4.2.1` | GFM Simulation | GFM Block-Level Whitespace Hygiene | Verifies blank line isolation before and after markdown tables, HTML tables, and code fences for GitHub parser stability. |
| `T4.3.1` | Color Contrast | Dark-Mode WCAG AAA Contrast Ratios | Computes relative luminance $L = 0.2126 R' + 0.7152 G' + 0.0722 B'$ and confirms color tokens (`#00FF88`, `#00D9FF`, `#F5F7FA`) exceed WCAG AAA ratio (7.0:1) against `#05080B`. |
| `T4.4.1` | Cross-Platform | POSIX Path Separator Enforcement Across Files | Scans all Markdown and HTML files to enforce `/` and reject Windows backslashes `\`. |
| `T4.5.1` | Responsive Viewport | Responsive Dimension Declarations | Asserts responsive `width="100%"` on profile vector banners to ensure adaptive rendering across desktop, tablet, and mobile displays. |

---

## 4. Test Runner CLI Usage & Invocation

The test runner is invoked directly via the Python interpreter:

```bash
# Run the complete 4-tier E2E verification test suite (default)
python scripts/verify.py --all

# Run a specific test tier
python scripts/verify.py --tier 1  # Feature Coverage
python scripts/verify.py --tier 2  # Boundary & Corner Cases
python scripts/verify.py --tier 3  # Cross-Feature Integration
python scripts/verify.py --tier 4  # Real-World Workload Scenarios

# Run with verbose debug logging
python scripts/verify.py --all --verbose

# Export machine-readable JSON test report
python scripts/verify.py --all --json-report test_report.json
```

### Exit Code Contracts
- **`0`**: All executed test assertions passed successfully.
- **`1`**: One or more assertions failed. Detailed failure diagnostics and stack traces are printed to `stderr` / `stdout`.
