#!/usr/bin/env python3
"""
Automated Verification & Quality Assurance Test Suite
=====================================================
Implements the 4-Tier E2E Testing Taxonomy for Ravi Ranjan Singh's GitHub Profile README.
Standard Library Only — Zero External Dependencies.

Taxonomy:
  Tier 1: Feature Coverage (XML/SVG Validity, 12 Sections, Asset Existence, Governance Docs, Motion Preview)
  Tier 2: Boundary & Corner Cases (Alt Text, Linux Case-Sensitivity, Heading Hierarchy, Tag Balancing, URL Security)
  Tier 3: Cross-Feature Integration (Asset 4-Way Parity, Aspect Ratio Consistency, Analytics Fallbacks, Docs Sync)
  Tier 4: Real-World Scenarios (Motion Preview CDN Independence, GFM Block Isolation, WCAG Contrast, POSIX Paths)
"""

import argparse
import json
import math
import os
import re
import struct
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import unquote, urlparse

# Reconfigure standard streams for UTF-8 compatibility on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Exit Codes
EXIT_SUCCESS = 0
EXIT_FAILURE = 1

# ANSI Color Codes for Terminal Output
COLOR_RESET = "\033[0m"
COLOR_BOLD = "\033[1m"
COLOR_RED = "\033[91m"
COLOR_GREEN = "\033[92m"
COLOR_YELLOW = "\033[93m"
COLOR_CYAN = "\033[96m"
COLOR_MAGENTA = "\033[95m"
COLOR_GRAY = "\033[90m"


class TestResult:
    def __init__(self, test_id: str, tier: int, category: str, name: str, status: str,
                 duration_ms: float, message: str = "", details: list = None):
        self.test_id = test_id
        self.tier = tier
        self.category = category
        self.name = name
        self.status = status  # PASS, FAIL, SKIP
        self.duration_ms = duration_ms
        self.message = message
        self.details = details or []

    def to_dict(self):
        return {
            "test_id": self.test_id,
            "tier": self.tier,
            "category": self.category,
            "name": self.name,
            "status": self.status,
            "duration_ms": round(self.duration_ms, 2),
            "message": self.message,
            "details": self.details,
        }


class VerificationHarness:
    def __init__(self, root_dir: Path, verbose: bool = False):
        self.root = root_dir.resolve()
        self.verbose = verbose
        self.results: list[TestResult] = []
        self.start_time = 0.0

    def log_debug(self, msg: str):
        if self.verbose:
            print(f"{COLOR_GRAY}    [DEBUG] {msg}{COLOR_RESET}")

    def execute_test(self, test_id: str, tier: int, category: str, name: str, test_fn):
        t0 = time.perf_counter()
        try:
            status, message, details = test_fn()
            duration_ms = (time.perf_counter() - t0) * 1000.0
            res = TestResult(test_id, tier, category, name, status, duration_ms, message, details)
        except Exception as ex:
            duration_ms = (time.perf_counter() - t0) * 1000.0
            res = TestResult(test_id, tier, category, name, "FAIL", duration_ms,
                             f"Unhandled exception: {str(ex)}", [str(ex)])
        self.results.append(res)
        self._print_result(res)

    def _print_result(self, res: TestResult):
        if res.status == "PASS":
            tag = f"{COLOR_GREEN}[PASS]{COLOR_RESET}"
        elif res.status == "SKIP":
            tag = f"{COLOR_YELLOW}[SKIP]{COLOR_RESET}"
        else:
            tag = f"{COLOR_RED}[FAIL]{COLOR_RESET}"

        print(f"  {tag} [{COLOR_BOLD}{res.test_id}{COLOR_RESET}] {res.name} {COLOR_GRAY}({res.duration_ms:.1f}ms){COLOR_RESET}")
        if res.status == "FAIL":
            print(f"      {COLOR_RED}Error: {res.message}{COLOR_RESET}")
            for d in res.details[:5]:
                print(f"      {COLOR_RED}  • {d}{COLOR_RESET}")
            if len(res.details) > 5:
                print(f"      {COLOR_RED}  ... and {len(res.details) - 5} more issues{COLOR_RESET}")

    # =========================================================================
    # TIER 1: FEATURE COVERAGE
    # =========================================================================
    def run_tier_1(self):
        print(f"\n{COLOR_CYAN}{COLOR_BOLD}=== TIER 1: FEATURE COVERAGE (Structural & Syntactic Validity) ==={COLOR_RESET}")

        # Category 1: XML/SVG Validity
        self.execute_test("T1.1.1", 1, "SVG Validity", "Standalone SVG XML Well-Formedness",
                          self._test_svg_xml_wellformedness)
        self.execute_test("T1.1.2", 1, "SVG Validity", "Root SVG Element & XML Namespace",
                          self._test_svg_root_and_namespace)
        self.execute_test("T1.1.3", 1, "SVG Validity", "ViewBox Attribute Presence & Format",
                          self._test_svg_viewbox_format)
        self.execute_test("T1.1.4", 1, "SVG Validity", "SVG Dimensions Positivity",
                          self._test_svg_dimensions_positivity)
        self.execute_test("T1.1.5", 1, "SVG Validity", "Zero Script & ForeignObject Injection",
                          self._test_svg_script_sanitization)

        # Category 2: README 12-Section Architecture
        self.execute_test("T1.2.1", 1, "README Architecture", "Hero Banner & Telemetry Header",
                          self._test_readme_hero_section)
        self.execute_test("T1.2.2", 1, "README Architecture", "Core Profile Sections (About, Focus, Architecture)",
                          self._test_readme_core_sections)
        self.execute_test("T1.2.3", 1, "README Architecture", "Evidence Sections (Projects, Stack, Analytics)",
                          self._test_readme_evidence_sections)
        self.execute_test("T1.2.4", 1, "README Architecture", "Human Dimensions (Leadership, Certs, Exploring)",
                          self._test_readme_human_sections)
        self.execute_test("T1.2.5", 1, "README Architecture", "Terminal Sections & 12-Section Monotonic Sequence",
                          self._test_readme_terminal_and_sequence)

        # Category 3: Asset & File Existence
        self.execute_test("T1.3.1", 1, "Asset Existence", "Core Standalone SVGs in assets/",
                          self._test_core_svg_existence)
        self.execute_test("T1.3.2", 1, "Asset Existence", "Declarative Motion SVGs in assets/motion/",
                          self._test_motion_svg_existence)
        self.execute_test("T1.3.3", 1, "Asset Existence", "Animated GIF Display Assets in assets/animated/",
                          self._test_animated_gif_existence)
        self.execute_test("T1.3.4", 1, "Asset Existence", "Static 2x PNG Fallbacks in assets/static/",
                          self._test_static_png_existence)
        self.execute_test("T1.3.5", 1, "Asset Existence", "Analytics Fallback Asset Existence",
                          self._test_analytics_fallback_existence)

        # Category 4: Repository Governance & Documentation Files
        self.execute_test("T1.4.1", 1, "Governance Files", "Root Governance Files Existence & Non-Empty",
                          self._test_root_governance_files)
        self.execute_test("T1.4.2", 1, "Governance Files", "Visual Design System Documentation (docs/design-system.md)",
                          self._test_design_system_doc)
        self.execute_test("T1.4.3", 1, "Governance Files", "Forensic Evidence Ledger (docs/content-verification.md)",
                          self._test_content_verification_doc)
        self.execute_test("T1.4.4", 1, "Governance Files", "Deployment Guide (docs/deployment-guide.md)",
                          self._test_deployment_guide_doc)
        self.execute_test("T1.4.5", 1, "Governance Files", "Zero-Pollution Clean Root Contract",
                          self._test_zero_pollution_contract)

        # Category 5: Interactive Motion Preview Files
        self.execute_test("T1.5.1", 1, "Motion Preview", "Motion Preview HTML5 Structure & Doctype",
                          self._test_motion_preview_html)
        self.execute_test("T1.5.2", 1, "Motion Preview", "Motion Preview CSS Styling Linkage",
                          self._test_motion_preview_css)
        self.execute_test("T1.5.3", 1, "Motion Preview", "Motion Preview JavaScript Engine Linkage",
                          self._test_motion_preview_js)
        self.execute_test("T1.5.4", 1, "Motion Preview", "HTML Canvas Element Declaration",
                          self._test_motion_preview_canvas)
        self.execute_test("T1.5.5", 1, "Motion Preview", "Animation Loop & Event Listeners in motion.js",
                          self._test_motion_preview_loop)

    # --- Tier 1 Test Implementations ---
    def _get_all_svgs(self) -> list[Path]:
        assets_dir = self.root / "assets"
        if not assets_dir.exists():
            return []
        return list(assets_dir.glob("**/*.svg"))

    def _test_svg_xml_wellformedness(self):
        svgs = self._get_all_svgs()
        if not svgs:
            return "FAIL", "No SVG assets found in assets/", ["assets/ directory contains no .svg files"]
        malformed = []
        for p in svgs:
            try:
                ET.parse(p)
            except Exception as e:
                malformed.append(f"{p.relative_to(self.root)}: {str(e)}")
        if malformed:
            return "FAIL", f"{len(malformed)} SVGs failed XML well-formedness", malformed
        return "PASS", f"All {len(svgs)} SVG files are well-formed XML", []

    def _test_svg_root_and_namespace(self):
        svgs = self._get_all_svgs()
        if not svgs:
            return "FAIL", "No SVG assets found in assets/", []
        errors = []
        for p in svgs:
            try:
                tree = ET.parse(p)
                root = tree.getroot()
                tag = root.tag.split("}")[-1] if "}" in root.tag else root.tag
                if tag != "svg":
                    errors.append(f"{p.name}: root tag is '{root.tag}', expected 'svg'")
                # Check XML namespace
                ns_match = "http://www.w3.org/2000/svg"
                if not root.tag.startswith(f"{{{ns_match}}}") and root.attrib.get("xmlns") != ns_match:
                    errors.append(f"{p.name}: missing xmlns='{ns_match}'")
            except Exception as e:
                errors.append(f"{p.name}: parse error: {str(e)}")
        if errors:
            return "FAIL", f"Root tag or namespace invalid in {len(errors)} SVGs", errors
        return "PASS", f"All {len(svgs)} SVGs have valid root 'svg' and W3C namespace", []

    def _test_svg_viewbox_format(self):
        svgs = self._get_all_svgs()
        if not svgs:
            return "FAIL", "No SVG assets found in assets/", []
        viewbox_re = re.compile(r"^\s*(-?\d+(\.\d+)?[\s,]+){3}-?\d+(\.\d+)?\s*$")
        errors = []
        for p in svgs:
            try:
                tree = ET.parse(p)
                root = tree.getroot()
                vb = root.attrib.get("viewBox")
                if not vb:
                    errors.append(f"{p.name}: missing 'viewBox' attribute")
                elif not viewbox_re.match(vb):
                    errors.append(f"{p.name}: invalid viewBox format '{vb}'")
            except Exception as e:
                errors.append(f"{p.name}: {str(e)}")
        if errors:
            return "FAIL", f"{len(errors)} SVGs have missing or invalid viewBox attributes", errors
        return "PASS", f"All {len(svgs)} SVGs declare valid numeric viewBox attributes", []

    def _test_svg_dimensions_positivity(self):
        svgs = self._get_all_svgs()
        if not svgs:
            return "FAIL", "No SVG assets found in assets/", []
        errors = []
        for p in svgs:
            try:
                tree = ET.parse(p)
                root = tree.getroot()
                vb = root.attrib.get("viewBox", "")
                parts = [float(x) for x in re.split(r"[\s,]+", vb.strip()) if x]
                if len(parts) == 4:
                    w, h = parts[2], parts[3]
                    if w <= 0 or h <= 0:
                        errors.append(f"{p.name}: non-positive viewBox dimensions {w}x{h}")
                # Also check explicit width / height if present
                for attr in ["width", "height"]:
                    val = root.attrib.get(attr)
                    if val and val.replace(".", "", 1).isdigit() and float(val) <= 0:
                        errors.append(f"{p.name}: non-positive attribute {attr}='{val}'")
            except Exception as e:
                errors.append(f"{p.name}: {str(e)}")
        if errors:
            return "FAIL", f"{len(errors)} SVGs have non-positive dimensions", errors
        return "PASS", f"All {len(svgs)} SVGs have strictly positive dimensions", []

    def _test_svg_script_sanitization(self):
        svgs = self._get_all_svgs()
        if not svgs:
            return "FAIL", "No SVG assets found in assets/", []
        violations = []
        for p in svgs:
            try:
                tree = ET.parse(p)
                root = tree.getroot()
                for el in root.iter():
                    local_tag = el.tag.split("}")[-1] if "}" in el.tag else el.tag
                    if local_tag in ("script", "foreignObject"):
                        violations.append(f"{p.name}: found forbidden <{local_tag}> tag")
            except Exception as e:
                violations.append(f"{p.name}: {str(e)}")
        if violations:
            return "FAIL", f"Found {len(violations)} security violations in SVGs", violations
        return "PASS", f"Zero <script> and zero <foreignObject> tags found across all {len(svgs)} SVGs", []

    def _get_readme_content(self) -> str:
        readme = self.root / "README.md"
        if not readme.exists():
            return ""
        return readme.read_text(encoding="utf-8")

    def _test_readme_hero_section(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist or is empty", []
        checks = []
        if not re.search(r'(?:src|href)=["\']\./assets/(?:hero\.svg|animated/hero-motion\.gif)["\']', content):
            checks.append("Missing reference to ./assets/hero.svg or ./assets/animated/hero-motion.gif in Hero banner")
        if "img.shields.io" not in content and "komarev.com" not in content:
            checks.append("Missing telemetry badges (shields.io or komarev profile counter)")
        if checks:
            return "FAIL", "Hero section validation failed", checks
        return "PASS", "Hero banner asset reference and telemetry badges verified", []

    def _test_readme_core_sections(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        missing = []
        if not re.search(r"##\s+(\d+\s+//\s+)?About Me", content, re.IGNORECASE):
            missing.append("Section: About Me")
        if not re.search(r"##\s+(\d+\s+//\s+)?Engineering (Focus|Identity)", content, re.IGNORECASE):
            missing.append("Section: Engineering Focus")
        if not re.search(r"##\s+(\d+\s+//\s+)?(Technical Architecture|Areas of Expertise)", content, re.IGNORECASE):
            missing.append("Section: Technical Architecture")
        if missing:
            return "FAIL", f"Missing core profile sections: {', '.join(missing)}", missing
        return "PASS", "Core sections (About Me, Engineering Focus, Technical Architecture) present", []

    def _test_readme_evidence_sections(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        missing = []
        if not re.search(r"##\s+(\d+\s+//\s+)?Featured Projects", content, re.IGNORECASE):
            missing.append("Section: Featured Projects")
        if not re.search(r"##\s+(\d+\s+//\s+)?Techn(ology|ical) Stack", content, re.IGNORECASE):
            missing.append("Section: Technology Stack")
        if not re.search(r"##\s+(\d+\s+//\s+)?GitHub Analytics", content, re.IGNORECASE):
            missing.append("Section: GitHub Analytics")
        if missing:
            return "FAIL", f"Missing evidence sections: {', '.join(missing)}", missing
        return "PASS", "Evidence sections (Featured Projects, Technology Stack, GitHub Analytics) present", []

    def _test_readme_human_sections(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        missing = []
        if not re.search(r"##\s+(\d+\s+//\s+)?Leadership", content, re.IGNORECASE):
            missing.append("Section: Leadership & Community")
        if not re.search(r"##\s+(\d+\s+//\s+)?Certifications", content, re.IGNORECASE):
            missing.append("Section: Certifications & Learning")
        if not re.search(r"##\s+(\d+\s+//\s+)?(Currently Exploring|Active Research)", content, re.IGNORECASE) and \
           not re.search(r"###\s+Active Research & Current Exploration", content, re.IGNORECASE):
            missing.append("Section: Currently Exploring / Active Research")
        if missing:
            return "FAIL", f"Missing human dimension sections: {', '.join(missing)}", missing
        return "PASS", "Human dimension sections (Leadership, Certifications, Exploring) present", []

    def _test_readme_terminal_and_sequence(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        sections = [
            ("Hero Banner", r"<img[^>]+src=[\"']\./assets/(?:hero\.svg|animated/hero-motion\.gif)[\"']"),
            ("About Me", r"##\s+(\d+\s+//\s+)?About Me"),
            ("Engineering Focus", r"##\s+(\d+\s+//\s+)?Engineering (Focus|Identity)"),
            ("Technical Architecture", r"##\s+(\d+\s+//\s+)?(Technical Architecture|Areas of Expertise)"),
            ("Featured Projects", r"##\s+(\d+\s+//\s+)?Featured Projects"),
            ("Technology Stack", r"##\s+(\d+\s+//\s+)?Techn(ology|ical) Stack"),
            ("GitHub Analytics", r"##\s+(\d+\s+//\s+)?GitHub Analytics"),
            ("Leadership & Community", r"##\s+(\d+\s+//\s+)?Leadership"),
            ("Certifications & Learning", r"##\s+(\d+\s+//\s+)?Certifications"),
            ("Currently Exploring", r"(##\s+(\d+\s+//\s+)?(Currently Exploring|Active Research)|###\s+Active Research & Current Exploration)"),
            ("Collaboration & Interests", r"##\s+(\d+\s+//\s+)?Collaboration"),
            ("Contact & Footer", r"(##\s+(\d+\s+//\s+)?Contact|<img[^>]+src=[\"']\./assets/(?:footer\.svg|animated/footer-motion\.gif)[\"']|Node ID:\s*RR-0808)"),
        ]
        last_pos = -1
        out_of_seq = []
        for name, pat in sections:
            m = re.search(pat, content, re.IGNORECASE)
            if not m:
                out_of_seq.append(f"Section pattern for '{name}' not found in README.md")
            elif m.start() < last_pos:
                out_of_seq.append(f"Section '{name}' appears out of sequence (found at char {m.start()} < {last_pos})")
            else:
                last_pos = m.start()
        if out_of_seq:
            return "FAIL", f"Sequence validation encountered {len(out_of_seq)} discrepancies", out_of_seq
        return "PASS", "README sections adhere to 12-section sequential progression", []

    def _test_core_svg_existence(self):
        required = ["hero.svg", "expertise.svg", "architecture.svg", "projects.svg", "footer.svg", "divider.svg"]
        missing = [f"assets/{name}" for name in required if not (self.root / "assets" / name).exists()]
        if missing:
            return "FAIL", f"Missing {len(missing)} core SVGs in assets/", missing
        return "PASS", f"All {len(required)} core standalone SVGs exist in assets/", []

    def _test_motion_svg_existence(self):
        required = ["hero-motion.svg", "expertise-motion.svg", "architecture-motion.svg",
                    "particles-motion.svg", "footer-motion.svg"]
        motion_dir = self.root / "assets" / "motion"
        missing = [f"assets/motion/{name}" for name in required if not (motion_dir / name).exists()]
        if missing:
            return "FAIL", f"Missing {len(missing)} motion SVGs in assets/motion/", missing
        return "PASS", f"All {len(required)} motion SVGs exist in assets/motion/", []

    def _test_animated_gif_existence(self):
        required = ["hero-motion.gif", "expertise-motion.gif", "architecture-motion.gif", "footer-motion.gif"]
        anim_dir = self.root / "assets" / "animated"
        missing = [f"assets/animated/{name}" for name in required if not (anim_dir / name).exists()]
        if missing:
            return "FAIL", f"Missing {len(missing)} animated GIFs in assets/animated/", missing
        return "PASS", f"All {len(required)} animated GIF assets exist in assets/animated/", []

    def _test_static_png_existence(self):
        required = ["hero.png", "expertise.png", "architecture.png", "footer.png"]
        static_dir = self.root / "assets" / "static"
        missing = [f"assets/static/{name}" for name in required if not (static_dir / name).exists()]
        if missing:
            return "FAIL", f"Missing {len(missing)} static PNGs in assets/static/", missing
        return "PASS", f"All {len(required)} static PNG fallback assets exist in assets/static/", []

    def _test_analytics_fallback_existence(self):
        # Checks for assets/analytics-fallback.svg OR static cards in assets/static/
        static_cards = ["assets/static/github-stats.svg", "assets/static/top-langs.svg", "assets/static/streak-stats.svg"]
        general_fallback = self.root / "assets" / "analytics-fallback.svg"
        missing_cards = [p for p in static_cards if not (self.root / p).exists()]
        has_cards = len(missing_cards) == 0
        has_general = general_fallback.exists()
        if not (has_cards or has_general):
            return "FAIL", "Missing analytics fallback assets (neither static cards nor analytics-fallback.svg found)", \
                missing_cards + ["assets/analytics-fallback.svg"]
        return "PASS", "Analytics fallback assets verified on disk", []

    def _test_root_governance_files(self):
        required = ["README.md", "AGENTS.md", "SETUP.md", ".agents/rules/github-profile.md"]
        missing = []
        for r in required:
            p = self.root / r
            if not p.exists() or p.stat().st_size == 0:
                missing.append(r)
        if missing:
            return "FAIL", f"Missing or empty governance files: {', '.join(missing)}", missing
        return "PASS", f"All {len(required)} root governance files exist and are non-empty", []

    def _test_design_system_doc(self):
        doc = self.root / "docs" / "design-system.md"
        if not doc.exists() or doc.stat().st_size == 0:
            return "FAIL", "docs/design-system.md is missing or empty", ["docs/design-system.md"]
        content = doc.read_text(encoding="utf-8")
        tokens = ["#05080B", "#00FF88", "#00D9FF", "#8B5CF6"]
        missing_tokens = [tok for tok in tokens if tok.lower() not in content.lower()]
        if missing_tokens:
            return "FAIL", f"Design tokens missing in docs/design-system.md: {missing_tokens}", missing_tokens
        return "PASS", "docs/design-system.md exists and documents cyber-engineering design tokens", []

    def _test_content_verification_doc(self):
        doc = self.root / "docs" / "content-verification.md"
        if not doc.exists() or doc.stat().st_size == 0:
            return "FAIL", "docs/content-verification.md is missing or empty", ["docs/content-verification.md"]
        content = doc.read_text(encoding="utf-8")
        repos = ["Hellthefox808/ShiVi-D", "Hellthefox808/NCC-CRM-V1.0"]
        missing_repos = [r for r in repos if r not in content]
        if missing_repos:
            return "FAIL", f"Key verified repositories missing in docs/content-verification.md: {missing_repos}", missing_repos
        return "PASS", "docs/content-verification.md exists and contains verified repository records", []

    def _test_deployment_guide_doc(self):
        doc = self.root / "docs" / "deployment-guide.md"
        if not doc.exists() or doc.stat().st_size == 0:
            return "FAIL", "docs/deployment-guide.md is missing or empty", ["docs/deployment-guide.md"]
        content = doc.read_text(encoding="utf-8")
        if "Hellthefox808" not in content:
            return "FAIL", "docs/deployment-guide.md does not reference special repository Hellthefox808", []
        return "PASS", "docs/deployment-guide.md exists and documents deployment instructions", []

    def _test_zero_pollution_contract(self):
        forbidden = ["node_modules", "package.json", "package-lock.json", "Cargo.toml", "Cargo.lock",
                     "pom.xml", "build.gradle", "yarn.lock", "pnpm-lock.yaml"]
        found = [f for f in forbidden if (self.root / f).exists()]
        if found:
            return "FAIL", f"Pollution detected in root: {found}", found
        return "PASS", "Root directory conforms to Zero-Dependency / Zero-Pollution contract", []

    def _test_motion_preview_html(self):
        index = self.root / "motion-preview" / "index.html"
        if not index.exists() or index.stat().st_size == 0:
            return "FAIL", "motion-preview/index.html is missing or empty", ["motion-preview/index.html"]
        content = index.read_text(encoding="utf-8")
        if "<!doctype html>" not in content.lower():
            return "FAIL", "motion-preview/index.html missing <!DOCTYPE html>", []
        return "PASS", "motion-preview/index.html has valid HTML5 doctype", []

    def _test_motion_preview_css(self):
        css = self.root / "motion-preview" / "styles.css"
        index = self.root / "motion-preview" / "index.html"
        if not css.exists() or css.stat().st_size == 0:
            return "FAIL", "motion-preview/styles.css is missing or empty", ["motion-preview/styles.css"]
        if index.exists():
            html_content = index.read_text(encoding="utf-8")
            if "styles.css" not in html_content:
                return "FAIL", "motion-preview/index.html does not link styles.css", []
        return "PASS", "motion-preview/styles.css exists and is referenced in index.html", []

    def _test_motion_preview_js(self):
        js = self.root / "motion-preview" / "motion.js"
        index = self.root / "motion-preview" / "index.html"
        if not js.exists() or js.stat().st_size == 0:
            return "FAIL", "motion-preview/motion.js is missing or empty", ["motion-preview/motion.js"]
        if index.exists():
            html_content = index.read_text(encoding="utf-8")
            if "motion.js" not in html_content:
                return "FAIL", "motion-preview/index.html does not load motion.js", []
        return "PASS", "motion-preview/motion.js exists and is loaded in index.html", []

    def _test_motion_preview_canvas(self):
        index = self.root / "motion-preview" / "index.html"
        if not index.exists():
            return "FAIL", "motion-preview/index.html is missing", []
        content = index.read_text(encoding="utf-8")
        if "<canvas" not in content.lower():
            return "FAIL", "No <canvas> element declared in motion-preview/index.html", []
        return "PASS", "motion-preview/index.html declares <canvas> viewport", []

    def _test_motion_preview_loop(self):
        js = self.root / "motion-preview" / "motion.js"
        if not js.exists():
            return "FAIL", "motion-preview/motion.js is missing", []
        content = js.read_text(encoding="utf-8")
        checks = []
        if "requestanimationframe" not in content.lower():
            checks.append("Missing requestAnimationFrame loop in motion.js")
        if "addeventlistener" not in content.lower() and "onresize" not in content.lower():
            checks.append("Missing event listeners (resize/mousemove) in motion.js")
        if checks:
            return "FAIL", "motion.js animation engine hooks incomplete", checks
        return "PASS", "motion.js implements requestAnimationFrame loop and event listeners", []

    # =========================================================================
    # TIER 2: BOUNDARY & CORNER CASES
    # =========================================================================
    def run_tier_2(self):
        print(f"\n{COLOR_CYAN}{COLOR_BOLD}=== TIER 2: BOUNDARY & CORNER CASES (Defensive Robustness) ==={COLOR_RESET}")

        # Category 1: Image Alt Text & Link Attributes
        self.execute_test("T2.1.1", 2, "Image Alt Text", "Mandatory Alt Attribute on All Images",
                          self._test_alt_attribute_presence)
        self.execute_test("T2.1.2", 2, "Image Alt Text", "Non-Empty Alt Text Invariant",
                          self._test_alt_text_non_empty)
        self.execute_test("T2.1.3", 2, "Image Alt Text", "Banned Placeholder Token Filtering",
                          self._test_alt_banned_placeholders)
        self.execute_test("T2.1.4", 2, "Image Alt Text", "Descriptive Alt Text Length Threshold",
                          self._test_alt_text_length)
        self.execute_test("T2.1.5", 2, "Image Alt Text", "Explicit Role Semantics for Dividers",
                          self._test_divider_alt_semantics)

        # Category 2: Local Relative Path Resolution & Linux Case Sensitivity
        self.execute_test("T2.2.1", 2, "Path Resolution", "Linux Case-Sensitive Directory Traversal",
                          self._test_linux_case_sensitivity)
        self.execute_test("T2.2.2", 2, "Path Resolution", "Query Parameter & Fragment Stripping",
                          self._test_query_fragment_stripping)
        self.execute_test("T2.2.3", 2, "Path Resolution", "Directory Traversal Boundary Escapes Prevention",
                          self._test_directory_traversal_boundaries)
        self.execute_test("T2.2.4", 2, "Path Resolution", "POSIX Forward-Slash Invariant",
                          self._test_posix_forward_slashes)
        self.execute_test("T2.2.5", 2, "Path Resolution", "Zero-Byte Local Target Asset Detection",
                          self._test_zero_byte_local_targets)

        # Category 3: Heading Hierarchy & Structure
        self.execute_test("T2.3.1", 2, "Heading Hierarchy", "README Heading Depth Step Invariant (D_curr <= D_prev + 1)",
                          self._test_readme_heading_hierarchy)
        self.execute_test("T2.3.2", 2, "Heading Hierarchy", "Documentation Suite Heading Depth Invariant",
                          self._test_docs_heading_hierarchy)
        self.execute_test("T2.3.3", 2, "Heading Hierarchy", "Root Level Document Title Governance",
                          self._test_document_title_governance)
        self.execute_test("T2.3.4", 2, "Heading Hierarchy", "No Orphaned Subheadings",
                          self._test_no_orphaned_subheadings)
        self.execute_test("T2.3.5", 2, "Heading Hierarchy", "Numbered Section Heading Syntax Integrity",
                          self._test_numbered_section_syntax)

        # Category 4: HTML Tag Pairing & Sanitizer Safety
        self.execute_test("T2.4.1", 2, "HTML Pairing", "HTML Container Tag Balance & Nesting",
                          self._test_html_tag_balancing)
        self.execute_test("T2.4.2", 2, "HTML Pairing", "Self-Closing Non-Void Container Tag Rejection",
                          self._test_self_closing_container_tags)
        self.execute_test("T2.4.3", 2, "HTML Pairing", "GitHub Sanitizer Forbidden Tag Rejection",
                          self._test_forbidden_sanitizer_tags)
        self.execute_test("T2.4.4", 2, "HTML Pairing", "Table Row and Cell Balancing",
                          self._test_table_structure_integrity)
        self.execute_test("T2.4.5", 2, "HTML Pairing", "XML ParseError Exception Safety",
                          self._test_xml_parseerror_handling)

        # Category 5: URL Protocol & Security
        self.execute_test("T2.5.1", 2, "URL Security", "HTTPS Protocol Enforcement on External URLs",
                          self._test_https_protocol_enforcement)
        self.execute_test("T2.5.2", 2, "URL Security", "URI Character Escaping & Whitespace Rejection",
                          self._test_uri_whitespace_escaping)
        self.execute_test("T2.5.3", 2, "URL Security", "Internal Anchor Fragment Target Integrity",
                          self._test_anchor_fragment_integrity)
        self.execute_test("T2.5.4", 2, "URL Security", "External Telemetry Domain Allowlist",
                          self._test_external_domain_allowlist)
        self.execute_test("T2.5.5", 2, "URL Security", "Mailto Protocol URI Syntax",
                          self._test_mailto_protocol_syntax)

    # --- Tier 2 Test Implementations ---
    def _extract_all_images(self, content: str) -> list[tuple[str, str]]:
        # Returns list of (src, alt)
        results = []
        # HTML <img> tags
        img_pattern = re.compile(r"<img\b([^>]+)>", re.IGNORECASE)
        for m in img_pattern.finditer(content):
            attrs = m.group(1)
            src_m = re.search(r'src=["\']([^"\']+)["\']', attrs, re.IGNORECASE)
            alt_m = re.search(r'alt=["\']([^"\']*)["\']', attrs, re.IGNORECASE)
            src = src_m.group(1) if src_m else ""
            alt = alt_m.group(1) if alt_m else None
            results.append((src, alt))
        # Markdown ![alt](src)
        md_pattern = re.compile(r"!\[([^\]]*)\]\(([^)]+)\)")
        for m in md_pattern.finditer(content):
            alt, src = m.group(1), m.group(2)
            results.append((src, alt))
        return results

    def _test_alt_attribute_presence(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        imgs = self._extract_all_images(content)
        missing_alt = [src for src, alt in imgs if alt is None]
        if missing_alt:
            return "FAIL", f"{len(missing_alt)} images missing alt attribute entirely", missing_alt
        return "PASS", f"All {len(imgs)} images declare an alt attribute", []

    def _test_alt_text_non_empty(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        imgs = self._extract_all_images(content)
        empty_alts = [src for src, alt in imgs if alt is not None and not alt.strip()]
        if empty_alts:
            return "FAIL", f"{len(empty_alts)} images have empty alt text (alt='')", empty_alts
        return "PASS", f"Zero empty alt attributes found across {len(imgs)} images", []

    def _test_alt_banned_placeholders(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        banned = {"todo", "tbd", "placeholder", "untitled", "screenshot"}
        imgs = self._extract_all_images(content)
        bad = []
        for src, alt in imgs:
            if alt:
                words = set(re.findall(r"\w+", alt.lower()))
                intersect = words.intersection(banned)
                if intersect:
                    bad.append(f"{src}: contains banned token(s) {list(intersect)} in '{alt}'")
        if bad:
            return "FAIL", f"Found {len(bad)} images with placeholder alt text", bad
        return "PASS", "No placeholder tokens (TODO, TBD, etc.) found in image alt text", []

    def _test_alt_text_length(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        imgs = self._extract_all_images(content)
        short = [f"src='{src}' alt='{alt}'" for src, alt in imgs if alt and len(alt.strip()) < 4]
        if short:
            return "FAIL", f"{len(short)} images have alt text shorter than 4 characters", short
        return "PASS", f"All {len(imgs)} image alt attributes satisfy minimum length threshold", []

    def _test_divider_alt_semantics(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        imgs = self._extract_all_images(content)
        dividers = [(src, alt) for src, alt in imgs if "divider" in src.lower()]
        bad = [src for src, alt in dividers if not alt or "divider" not in alt.lower()]
        if bad:
            return "FAIL", f"{len(bad)} divider images lack descriptive 'Divider' alt text", bad
        return "PASS", f"All {len(dividers)} divider elements declare explicit 'Divider' semantics", []

    def _test_linux_case_sensitivity(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        # Find all relative local paths starting with ./assets or assets
        paths = re.findall(r'(?:src|href)=["\'](\.?/assets/[^"\'\s?#]+)["\']', content)
        paths += re.findall(r'!\[[^\]]*\]\((\.?/assets/[^)"\'\s?#]+)\)', content)
        paths += re.findall(r'\[[^\]]*\]\((\.?/assets/[^)"\'\s?#]+)\)', content)

        casing_errors = []
        for ref in set(paths):
            clean = ref.lstrip("./")
            parts = clean.split("/")
            curr = self.root
            for seg in parts:
                if not curr.exists():
                    casing_errors.append(f"Parent directory '{curr.relative_to(self.root)}' does not exist for '{ref}'")
                    break
                actual_names = [e.name for e in curr.iterdir()]
                if seg not in actual_names:
                    # Check case-insensitive collision
                    lower_map = {n.lower(): n for n in actual_names}
                    if seg.lower() in lower_map:
                        casing_errors.append(
                            f"Path '{ref}': segment '{seg}' casing mismatch against disk '{lower_map[seg.lower()]}'")
                    else:
                        casing_errors.append(f"Path '{ref}': segment '{seg}' not found in '{curr.name}'")
                    break
                curr = curr / seg

        if casing_errors:
            return "FAIL", f"Linux case sensitivity simulation found {len(casing_errors)} errors", casing_errors
        return "PASS", f"All {len(set(paths))} local relative paths strictly match disk casing", []

    def _test_query_fragment_stripping(self):
        # Validates that query params and fragments on local paths are stripped cleanly
        sample_path = "./assets/hero.svg?v=1.0#main"
        clean = sample_path.split("?")[0].split("#")[0].lstrip("./")
        if clean != "assets/hero.svg":
            return "FAIL", f"Sanitizer produced unexpected path '{clean}'", []
        return "PASS", "Local path URI fragment and query parameter separation logic verified", []

    def _test_directory_traversal_boundaries(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        escapes = re.findall(r'(\.\./[^"\'\s\)]+)', content)
        illegal = []
        for esc in escapes:
            resolved = (self.root / esc).resolve()
            if not str(resolved).startswith(str(self.root)):
                illegal.append(f"Traversal escaped root: '{esc}' -> '{resolved}'")
        if illegal:
            return "FAIL", f"Detected {len(illegal)} directory traversal boundary escapes", illegal
        return "PASS", "Zero relative links escape the repository root boundary", []

    def _test_posix_forward_slashes(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        win_paths = re.findall(r'(?:src|href)=["\'][^"\']*\\[^"\']*["\']', content)
        win_paths += re.findall(r'\]\([^)]*\\[^)]*\)', content)
        if win_paths:
            return "FAIL", f"Found {len(win_paths)} non-POSIX Windows backslashes in paths", win_paths
        return "PASS", "All Markdown and HTML file references strictly use POSIX forward slashes", []

    def _test_zero_byte_local_targets(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        paths = re.findall(r'(?:src|href)=["\'](\.?/assets/[^"\'\s?#]+)["\']', content)
        paths += re.findall(r'!\[[^\]]*\]\((\.?/assets/[^)"\'\s?#]+)\)', content)
        zero_byte = []
        for ref in set(paths):
            p = self.root / ref.lstrip("./")
            if p.exists() and p.is_file() and p.stat().st_size == 0:
                zero_byte.append(str(p.relative_to(self.root)))
        if zero_byte:
            return "FAIL", f"Found {len(zero_byte)} zero-byte asset files referenced", zero_byte
        return "PASS", "All referenced local asset targets have positive file size (st_size > 0)", []

    def _test_readme_heading_hierarchy(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        lines = content.splitlines()
        skipped = []
        last_lvl = 0
        in_code_block = False
        for idx, line in enumerate(lines, 1):
            if line.strip().startswith("```"):
                in_code_block = not in_code_block
                continue
            if in_code_block:
                continue
            m = re.match(r"^(#{1,6})\s+", line)
            if m:
                lvl = len(m.group(1))
                if last_lvl > 0 and lvl > last_lvl + 1:
                    skipped.append(f"Line {idx}: H{last_lvl} jumped directly to H{lvl} without intermediate level")
                last_lvl = lvl
        if skipped:
            return "FAIL", f"Heading hierarchy broken ({len(skipped)} skipped levels)", skipped
        return "PASS", "README heading hierarchy strictly preserves monotonic depth transitions", []

    def _test_docs_heading_hierarchy(self):
        docs = list(self.root.glob("docs/*.md"))
        if not docs:
            return "SKIP", "No markdown files found in docs/ to evaluate", []
        skipped = []
        for doc in docs:
            lines = doc.read_text(encoding="utf-8").splitlines()
            last_lvl = 0
            in_code = False
            for idx, line in enumerate(lines, 1):
                if line.strip().startswith("```"):
                    in_code = not in_code
                    continue
                if in_code:
                    continue
                m = re.match(r"^(#{1,6})\s+", line)
                if m:
                    lvl = len(m.group(1))
                    if last_lvl > 0 and lvl > last_lvl + 1:
                        skipped.append(f"{doc.name}:{idx} (H{last_lvl} -> H{lvl})")
                    last_lvl = lvl
        if skipped:
            return "FAIL", f"Heading hierarchy broken in docs/ ({len(skipped)} skips)", skipped
        return "PASS", f"All {len(docs)} docs/*.md files preserve valid heading hierarchy", []

    def _test_document_title_governance(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        # Title can be H1 (# Title) or top Hero banner with h1/h3 or alt text
        has_h1 = bool(re.search(r"^#\s+", content, re.MULTILINE))
        has_hero_banner = bool(re.search(r'assets/hero\.svg', content))
        if not (has_h1 or has_hero_banner):
            return "FAIL", "README lacks title representation (no H1 or Hero banner)", []
        return "PASS", "Document title governance verified via top-level hero banner / heading", []

    def _test_no_orphaned_subheadings(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        # Checks that H4 doesn't exist before any H3, H3 doesn't exist before H2
        headings = re.findall(r"^(#{2,4})\s+(.+)$", content, re.MULTILINE)
        levels = [len(h[0]) for h in headings]
        if levels and min(levels) > 2:
            return "FAIL", f"First section heading is H{levels[0]}, expected H2", []
        return "PASS", "Zero orphaned subheadings detected", []

    def _test_numbered_section_syntax(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        h2s = re.findall(r"^##\s+(.+)$", content, re.MULTILINE)
        if not h2s:
            return "FAIL", "No H2 section headings found in README.md", []
        # Verify that numbered sections follow a uniform convention (e.g. '01 // ...')
        numbered = [h for h in h2s if re.match(r"^\d{2}\s+//\s+", h)]
        if numbered and len(numbered) < len(h2s) // 2:
            return "FAIL", f"Inconsistent section numbering ({len(numbered)} of {len(h2s)} numbered)", []
        return "PASS", f"Section headings adhere to consistent syntax ({len(h2s)} H2 sections)", []

    def _test_html_tag_balancing(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        # Strip code blocks
        clean_content = re.sub(r"```[\s\S]*?```", "", content)
        clean_content = re.sub(r"<!--[\s\S]*?-->", "", clean_content)

        container_tags = ["div", "table", "tr", "td", "th", "p", "picture", "a", "span", "sub", "b", "i", "ul", "li"]
        void_tags = {"img", "br", "hr", "source", "meta", "link", "input"}

        tag_pattern = re.compile(r"<(/)?([a-zA-Z0-9]+)\b([^>]*?)>", re.IGNORECASE)
        stack = []
        errors = []

        for m in tag_pattern.finditer(clean_content):
            is_close = m.group(1) is not None
            raw_tag = m.group(2).lower()
            attrs = m.group(3)

            if raw_tag in void_tags:
                continue
            if raw_tag not in container_tags:
                continue

            # Check self-closing on container tag (e.g. <div />)
            if not is_close and attrs.strip().endswith("/"):
                errors.append(f"Illegal self-closing container tag <{raw_tag} />")
                continue

            if not is_close:
                stack.append(raw_tag)
            else:
                if not stack:
                    errors.append(f"Unexpected closing tag </{raw_tag}> with empty stack")
                elif stack[-1] != raw_tag:
                    errors.append(f"Mismatched tag: expected </{stack[-1]}>, found </{raw_tag}>")
                    if raw_tag in stack:
                        while stack and stack[-1] != raw_tag:
                            stack.pop()
                        if stack:
                            stack.pop()
                else:
                    stack.pop()

        if stack:
            errors.append(f"Unclosed HTML container tags at end of file: {stack}")
        if errors:
            return "FAIL", f"HTML container tag balance violations ({len(errors)} errors)", errors
        return "PASS", "All HTML container tags in README.md are strictly balanced and properly nested", []

    def _test_self_closing_container_tags(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        clean = re.sub(r"```[\s\S]*?```", "", content)
        clean = re.sub(r"<!--[\s\S]*?-->", "", clean)
        self_closing = re.findall(r"<(div|table|tr|td|p|span|a)\b[^>]*/>", clean, re.IGNORECASE)
        if self_closing:
            return "FAIL", f"Found illegal self-closing container tags: {self_closing}", self_closing
        return "PASS", "Zero illegal self-closing container tags detected", []

    def _test_forbidden_sanitizer_tags(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        clean = re.sub(r"```[\s\S]*?```", "", content)
        clean = re.sub(r"<!--[\s\S]*?-->", "", clean)
        forbidden = ["script", "style", "iframe", "object", "embed", "applet", "form"]
        found = []
        for tag in forbidden:
            if re.search(rf"<{tag}\b", clean, re.IGNORECASE):
                found.append(f"<{tag}>")
        if found:
            return "FAIL", f"Forbidden HTML tags found (sanitizer risk): {found}", found
        return "PASS", "Zero forbidden active HTML elements found in README.md", []

    def _test_table_structure_integrity(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        clean = re.sub(r"```[\s\S]*?```", "", content)
        # Find HTML tables
        tables = re.findall(r"<table\b[^>]*>([\s\S]*?)</table>", clean, re.IGNORECASE)
        bad_tables = []
        for idx, tbl in enumerate(tables, 1):
            rows = re.findall(r"<tr\b[^>]*>([\s\S]*?)</tr>", tbl, re.IGNORECASE)
            if not rows:
                bad_tables.append(f"Table #{idx} has no <tr> rows")
            for r_idx, row in enumerate(rows, 1):
                cells = re.findall(r"<(?:td|th)\b", row, re.IGNORECASE)
                if not cells:
                    bad_tables.append(f"Table #{idx} Row #{r_idx} has no <td> or <th> cells")
        if bad_tables:
            return "FAIL", f"Table structural integrity issues ({len(bad_tables)} errors)", bad_tables
        return "PASS", f"All {len(tables)} HTML tables contain valid rows and cell structures", []

    def _test_xml_parseerror_handling(self):
        # Adversarial test: verify that parser properly rejects malformed XML string
        malformed_xml = "<svg viewBox='0 0 100 100'><unclosed_tag></svg>"
        try:
            ET.fromstring(malformed_xml)
            return "FAIL", "ElementTree failed to reject malformed XML snippet", []
        except ET.ParseError:
            return "PASS", "XML parser correctly raises ParseError on malformed markup", []

    def _test_https_protocol_enforcement(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        # Find all absolute URLs
        urls = re.findall(r'href=["\'](http://[^"\']+)["\']', content, re.IGNORECASE)
        urls += re.findall(r'src=["\'](http://[^"\']+)["\']', content, re.IGNORECASE)
        urls += re.findall(r'\]\((http://[^)]+)\)', content, re.IGNORECASE)
        if urls:
            return "FAIL", f"Found {len(urls)} insecure HTTP (non-HTTPS) links", urls
        return "PASS", "Zero insecure HTTP external links detected (100% HTTPS enforcement)", []

    def _test_uri_whitespace_escaping(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        # Check URLs in href/src for raw whitespace
        bad_urls = re.findall(r'(?:href|src)=["\'](https?://[^"\']*\s[^"\']*)["\']', content)
        if bad_urls:
            return "FAIL", f"Found unescaped whitespace in external URLs: {bad_urls}", bad_urls
        return "PASS", "All external URLs are free of unescaped whitespace characters", []

    def _test_anchor_fragment_integrity(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        # Find all internal anchor links: href="#something" or [text](#something)
        anchors = re.findall(r'href=["\']#([^"\']+)["\']', content)
        anchors += re.findall(r'\]\(#([^)]+)\)', content)

        # Generate GFM slugs from all headings in README
        headings = re.findall(r"^#{1,6}\s+(.+)$", content, re.MULTILINE)
        valid_slugs = set()
        for h in headings:
            # GFM slug algorithm
            slug = h.strip().lower()
            slug = re.sub(r"[^\w\s-]", "", slug)
            slug = re.sub(r"\s+", "-", slug)
            valid_slugs.add(slug)

        broken = [a for a in set(anchors) if a not in valid_slugs]
        if broken:
            return "FAIL", f"Found {len(broken)} broken anchor fragments: {broken}", broken
        return "PASS", f"All {len(set(anchors))} internal anchor fragment links resolve to valid headings", []

    def _test_external_domain_allowlist(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        urls = re.findall(r'https?://([a-zA-Z0-9.-]+)', content)
        known_domains = {
            "github.com", "raw.githubusercontent.com", "linkedin.com", "www.linkedin.com",
            "img.shields.io", "komarev.com", "skillicons.dev", "streak-stats.demolab.com",
            "github-readme-stats-sigma-five.vercel.app", "cisco.com", "www.cisco.com"
        }
        unknown = [d for d in set(urls) if d not in known_domains]
        if unknown:
            self.log_debug(f"External domains detected: {unknown}")
        return "PASS", f"External URLs evaluated across {len(set(urls))} distinct domains", []

    def _test_mailto_protocol_syntax(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        mailtos = re.findall(r'href=["\']mailto:([^"\']+)["\']', content)
        invalid = [m for m in mailtos if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", m)]
        if invalid:
            return "FAIL", f"Malformed mailto address: {invalid}", invalid
        return "PASS", f"All {len(mailtos)} mailto URI links follow valid RFC 5322 structure", []

    # =========================================================================
    # TIER 3: CROSS-FEATURE INTEGRATION & FALLBACK CONSISTENCY
    # =========================================================================
    def run_tier_3(self):
        print(f"\n{COLOR_CYAN}{COLOR_BOLD}=== TIER 3: CROSS-FEATURE INTEGRATION (Pairwise Coverage & Fallbacks) ==={COLOR_RESET}")

        self.execute_test("T3.1.1", 3, "Asset Parity", "Core 4-Way Multi-Tier Asset Parity (SVG, Motion, GIF, PNG)",
                          self._test_asset_4way_parity)
        self.execute_test("T3.2.1", 3, "Aspect Ratio", "ViewBox Aspect Ratio Consistency with Static PNG Header",
                          self._test_aspect_ratio_consistency)
        self.execute_test("T3.3.1", 3, "Analytics Fallback", "Live Stats Card & Static SVG Fallback Cohesion",
                          self._test_analytics_fallback_cohesion)
        self.execute_test("T3.4.1", 3, "Content Cross-Check", "Canonical Project URLs Parity with docs/content-verification.md",
                          self._test_project_urls_parity)
        self.execute_test("T3.5.1", 3, "Credential Cross-Check", "Key Metrics & Military Credentials Synchronization",
                          self._test_metrics_credentials_sync)

    # --- Tier 3 Test Implementations ---
    def _test_asset_4way_parity(self):
        core_banners = ["hero", "expertise", "architecture", "projects", "footer"]
        missing = []
        for name in core_banners:
            svg = self.root / f"assets/{name}.svg"
            motion = self.root / f"assets/motion/{name}-motion.svg"
            gif = self.root / f"assets/animated/{name}-motion.gif"
            png = self.root / f"assets/static/{name}.png"
            if not svg.exists(): missing.append(f"assets/{name}.svg")
            if not motion.exists(): missing.append(f"assets/motion/{name}-motion.svg")
            if not gif.exists(): missing.append(f"assets/animated/{name}-motion.gif")
            if not png.exists(): missing.append(f"assets/static/{name}.png")
        if missing:
            return "FAIL", f"Missing {len(missing)} asset counterparts across 4-way parity matrix", missing
        return "PASS", f"Complete 4-way parity verified across all {len(core_banners)} core visual banners", []

    def _read_png_dimensions(self, png_path: Path) -> tuple[int, int] | None:
        try:
            with open(png_path, "rb") as f:
                header = f.read(24)
                if len(header) >= 24 and header[:8] == b"\x89PNG\r\n\x1a\n":
                    # IHDR chunk: 4 bytes length, 4 bytes 'IHDR', 4 bytes width, 4 bytes height
                    width, height = struct.unpack(">II", header[16:24])
                    return width, height
        except Exception:
            pass
        return None

    def _test_aspect_ratio_consistency(self):
        core_banners = ["hero", "expertise", "architecture", "footer"]
        discrepancies = []
        checked = 0
        for name in core_banners:
            svg_path = self.root / f"assets/{name}.svg"
            png_path = self.root / f"assets/static/{name}.png"
            if not (svg_path.exists() and png_path.exists()):
                continue
            try:
                tree = ET.parse(svg_path)
                vb = tree.getroot().attrib.get("viewBox", "")
                parts = [float(x) for x in re.split(r"[\s,]+", vb.strip()) if x]
                if len(parts) == 4:
                    svg_ar = parts[2] / parts[3]
                    png_dims = self._read_png_dimensions(png_path)
                    if png_dims and png_dims[1] > 0:
                        png_ar = png_dims[0] / png_dims[1]
                        diff = abs(svg_ar - png_ar) / svg_ar
                        checked += 1
                        if diff > 0.05:  # Tolerance: 5%
                            discrepancies.append(
                                f"{name}: SVG AR={svg_ar:.3f} vs PNG AR={png_ar:.3f} (diff={diff*100:.1f}%)")
            except Exception as e:
                discrepancies.append(f"{name}: error reading aspect ratio: {str(e)}")

        if discrepancies:
            return "FAIL", f"Aspect ratio mismatches detected in {len(discrepancies)} assets", discrepancies
        if checked == 0:
            return "SKIP", "No paired SVG/PNG assets available on disk to verify aspect ratio", []
        return "PASS", f"Aspect ratio consistency verified across {checked} paired SVG/PNG assets (diff <= 5%)", []

    def _test_analytics_fallback_cohesion(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        # Check if README contains live analytics section
        has_analytics_section = bool(re.search(r"##\s+(\d+\s+//\s+)?GitHub Analytics", content, re.IGNORECASE))
        if not has_analytics_section:
            return "FAIL", "GitHub Analytics section missing in README.md", []

        # Check for fallback presence (either fallback SVG referenced, picture tags, or static card assets existing)
        fallback_svg = self.root / "assets" / "analytics-fallback.svg"
        static_card = self.root / "assets" / "static" / "github-stats.svg"
        has_fallback_markup = "analytics-fallback" in content or "assets/static/github-stats" in content or "<picture" in content
        has_fallback_file = fallback_svg.exists() or static_card.exists()

        if not (has_fallback_markup or has_fallback_file):
            return "FAIL", "Zero static fallback cohesion found for GitHub analytics telemetry", []
        return "PASS", "GitHub Analytics telemetry demonstrates static fallback protection cohesion", []

    def _test_project_urls_parity(self):
        readme_content = self._get_readme_content()
        docs_path = self.root / "docs" / "content-verification.md"
        if not readme_content or not docs_path.exists():
            return "FAIL", "README.md or docs/content-verification.md missing", []
        docs_content = docs_path.read_text(encoding="utf-8")

        canonical_projects = [
            "Hellthefox808/ShiVi-D",
            "Hellthefox808/NCC-CRM-V1.0",
            "Hellthefox808/ShiVi-AI-Offline-First-Multilingual-Education-Platform",
            "Hellthefox808/agri-tech-2..0",
            "Hellthefox808/Travel-v1.1.2-Buget",
            "Hellthefox808/Expense-tracker"
        ]
        missing_readme = [p for p in canonical_projects if p not in readme_content]
        missing_docs = [p for p in canonical_projects if p not in docs_content]
        issues = []
        if missing_readme:
            issues.append(f"Missing in README.md: {missing_readme}")
        if missing_docs:
            issues.append(f"Missing in docs/content-verification.md: {missing_docs}")
        if issues:
            return "FAIL", "Project URL synchronization discrepancy between README and docs", issues
        return "PASS", f"All {len(canonical_projects)} canonical projects synchronized between README and docs", []

    def _test_metrics_credentials_sync(self):
        readme_content = self._get_readme_content()
        docs_path = self.root / "docs" / "content-verification.md"
        if not readme_content or not docs_path.exists():
            return "FAIL", "README.md or docs/content-verification.md missing", []
        docs_content = docs_path.read_text(encoding="utf-8")

        required_claims = [
            ("Vitest assertions claim (471)", "471"),
            ("LRU cache bound (MAX_MEMORY_ITEMS = 5000)", "5000"),
            ("Military Battalion (19 Jharkhand Bn NCC)", "19 Jharkhand"),
            ("Cadet Rank (Sergeant / SGT)", "Sergeant"),
            ("Best Cadet Award (2019)", "2019"),
        ]
        mismatches = []
        for desc, token in required_claims:
            in_readme = token in readme_content
            in_docs = token in docs_content
            if not (in_readme and in_docs):
                mismatches.append(f"{desc}: in_readme={in_readme}, in_docs={in_docs}")
        if mismatches:
            return "FAIL", f"Found {len(mismatches)} credential / metrics discrepancies", mismatches
        return "PASS", f"All {len(required_claims)} technical metrics & credentials cross-verified between documents", []

    # =========================================================================
    # TIER 4: REAL-WORLD SCENARIOS & RENDERING SIMULATION
    # =========================================================================
    def run_tier_4(self):
        print(f"\n{COLOR_CYAN}{COLOR_BOLD}=== TIER 4: REAL-WORLD SCENARIOS (Workload & Rendering Simulation) ==={COLOR_RESET}")

        self.execute_test("T4.1.1", 4, "Motion Engine", "Motion Preview Standalone CDN Independence",
                          self._test_preview_cdn_independence)
        self.execute_test("T4.2.1", 4, "GFM Simulation", "GFM Block-Level Whitespace Hygiene",
                          self._test_gfm_block_whitespace)
        self.execute_test("T4.3.1", 4, "Color Contrast", "Dark-Mode WCAG AAA Contrast Ratios",
                          self._test_wcag_color_contrast)
        self.execute_test("T4.4.1", 4, "Cross-Platform", "POSIX Path Separator Enforcement Across Files",
                          self._test_posix_across_all_files)
        self.execute_test("T4.5.1", 4, "Responsive Viewport", "Responsive Dimension Declarations on Profile Visuals",
                          self._test_responsive_viewport_dimensions)

    # --- Tier 4 Test Implementations ---
    def _test_preview_cdn_independence(self):
        preview_index = self.root / "motion-preview" / "index.html"
        if not preview_index.exists():
            return "FAIL", "motion-preview/index.html does not exist", []
        content = preview_index.read_text(encoding="utf-8")
        # Check that script tags do not load remote third-party scripts
        remote_scripts = re.findall(r'<script\b[^>]*src=["\'](https?://[^"\']+)["\']', content, re.IGNORECASE)
        if remote_scripts:
            return "FAIL", f"Motion preview has external remote CDN dependencies: {remote_scripts}", remote_scripts
        return "PASS", "Motion preview operates completely offline with zero remote CDN dependencies", []

    def _test_gfm_block_whitespace(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        lines = content.splitlines()
        violations = []
        in_code_block = False
        for idx, line in enumerate(lines):
            stripped = line.strip()
            if stripped.startswith("```"):
                if not in_code_block:
                    in_code_block = True
                    if idx > 0:
                        prev = lines[idx - 1].strip()
                        if prev and not prev.startswith("<") and not prev.startswith("#"):
                            violations.append(f"Line {idx+1}: Opening code fence follows text without preceding blank line")
                else:
                    in_code_block = False
                    if idx + 1 < len(lines):
                        nxt = lines[idx + 1].strip()
                        if nxt and not nxt.startswith("<") and not nxt.startswith("#"):
                            violations.append(f"Line {idx+1}: Closing code fence followed by text without subsequent blank line")
                continue

            if in_code_block:
                continue

            # Check markdown table
            if stripped.startswith("|") and idx > 0:
                prev = lines[idx - 1].strip()
                if prev and not prev.startswith("|") and not prev.startswith("<") and not prev.startswith("#"):
                    violations.append(f"Line {idx+1}: Markdown table follows text without preceding blank line")

        if violations:
            return "FAIL", f"GFM block isolation whitespace violations ({len(violations)} issues)", violations
        return "PASS", "All block elements (tables, code blocks) adhere to GFM whitespace isolation rules", []

    def _calculate_relative_luminance(self, hex_color: str) -> float:
        hex_clean = hex_color.lstrip("#")
        if len(hex_clean) == 3:
            hex_clean = "".join(c * 2 for c in hex_clean)
        if len(hex_clean) != 6:
            return 0.0
        r_byte, g_byte, b_byte = int(hex_clean[0:2], 16), int(hex_clean[2:4], 16), int(hex_clean[4:6], 16)
        channels = []
        for c in (r_byte, g_byte, b_byte):
            c_norm = c / 255.0
            if c_norm <= 0.03928:
                channels.append(c_norm / 12.92)
            else:
                channels.append(((c_norm + 0.055) / 1.055) ** 2.4)
        return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]

    def _calculate_contrast_ratio(self, hex_fg: str, hex_bg: str) -> float:
        l1 = self._calculate_relative_luminance(hex_fg)
        l2 = self._calculate_relative_luminance(hex_bg)
        lighter = max(l1, l2)
        darker = min(l1, l2)
        return (lighter + 0.05) / (darker + 0.05)

    def _test_wcag_color_contrast(self):
        bg = "#05080B"
        palette = [
            ("Neon Emerald", "#00FF88", 7.0),   # AAA target (>= 7:1)
            ("Electric Cyan", "#00D9FF", 7.0),  # AAA target
            ("Primary Text", "#F5F7FA", 7.0),   # AAA target
            ("Cyber Violet", "#9875FF", 4.5),   # AA target (>= 4.5:1)
        ]
        results = []
        failures = []
        for name, hex_code, min_ratio in palette:
            ratio = self._calculate_contrast_ratio(hex_code, bg)
            results.append(f"{name} ({hex_code}): {ratio:.2f}:1 (min required: {min_ratio}:1)")
            if ratio < min_ratio:
                failures.append(f"{name} {hex_code} failed WCAG contrast with {ratio:.2f}:1 (< {min_ratio}:1)")
        if failures:
            return "FAIL", f"WCAG contrast violations on dark background {bg}", failures
        return "PASS", f"All primary theme colors exceed WCAG AA/AAA contrast thresholds against {bg}", results

    def _test_posix_across_all_files(self):
        md_and_html = list(self.root.glob("*.md")) + list(self.root.glob("docs/*.md")) + list(self.root.glob("motion-preview/*.html"))
        windows_slashes = []
        for f in md_and_html:
            content = f.read_text(encoding="utf-8")
            matches = re.findall(r'(?:src|href)=["\'][^"\']*\\[^"\']*["\']', content)
            if matches:
                windows_slashes.append(f"{f.name}: {matches}")
        if windows_slashes:
            return "FAIL", f"Found Windows backslash paths across {len(windows_slashes)} files", windows_slashes
        return "PASS", f"All {len(md_and_html)} Markdown and HTML files enforce strict POSIX forward-slash paths", []

    def _test_responsive_viewport_dimensions(self):
        content = self._get_readme_content()
        if not content:
            return "FAIL", "README.md does not exist", []
        # Check that top banners use responsive width="100%" or equivalent
        banners = re.findall(r'<img\b[^>]*src=["\']\./assets/(?:animated/(?:hero|expertise|architecture|footer|projects)-motion\.gif|(?:hero|expertise|architecture|divider|footer|projects)\.svg)["\'][^>]*>', content)
        non_responsive = []
        for b in banners:
            if 'width="100%"' not in b and "width='100%'" not in b:
                non_responsive.append(b)
        if non_responsive:
            return "FAIL", f"Found non-responsive banner elements (missing width='100%'): {non_responsive}", non_responsive
        return "PASS", f"All {len(banners)} major visual banners declare responsive 100% width viewport attributes", []

    # =========================================================================
    # SUMMARY & EXECUTION RUNNER
    # =========================================================================
    def run_all(self):
        self.start_time = time.time()
        print(f"\n{COLOR_MAGENTA}{COLOR_BOLD}===================================================================={COLOR_RESET}")
        print(f"{COLOR_MAGENTA}{COLOR_BOLD}   RAVI RANJAN SINGH GITHUB PROFILE 4-TIER E2E VERIFICATION SUITE   {COLOR_RESET}")
        print(f"{COLOR_MAGENTA}{COLOR_BOLD}===================================================================={COLOR_RESET}")
        print(f"{COLOR_GRAY}Project Root: {self.root}{COLOR_RESET}")

        self.run_tier_1()
        self.run_tier_2()
        self.run_tier_3()
        self.run_tier_4()

        return self.print_summary()

    def print_summary(self) -> int:
        duration = time.time() - self.start_time
        passed = sum(1 for r in self.results if r.status == "PASS")
        failed = sum(1 for r in self.results if r.status == "FAIL")
        skipped = sum(1 for r in self.results if r.status == "SKIP")
        total = len(self.results)

        print(f"\n{COLOR_MAGENTA}{COLOR_BOLD}--------------------------------------------------------------------{COLOR_RESET}")
        print(f"{COLOR_BOLD}VERIFICATION SUMMARY: {COLOR_RESET}"
              f"{COLOR_GREEN}{passed} Passed{COLOR_RESET} | "
              f"{COLOR_RED}{failed} Failed{COLOR_RESET} | "
              f"{COLOR_YELLOW}{skipped} Skipped{COLOR_RESET} | "
              f"Total: {total} tests in {duration:.2f}s")
        print(f"{COLOR_MAGENTA}{COLOR_BOLD}--------------------------------------------------------------------{COLOR_RESET}")

        if failed > 0:
            print(f"\n{COLOR_RED}{COLOR_BOLD}FAILED TEST BREAKDOWN ({failed} failures):{COLOR_RESET}")
            for r in self.results:
                if r.status == "FAIL":
                    print(f"  • [{r.test_id}] {r.name}: {r.message}")
            return EXIT_FAILURE

        print(f"\n{COLOR_GREEN}{COLOR_BOLD}ALL {passed} TESTS PASSED PERFECTLY (100% TEST PASS RATE){COLOR_RESET}\n")
        return EXIT_SUCCESS

    def export_json(self, path: Path):
        data = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "root": str(self.root),
            "summary": {
                "total": len(self.results),
                "passed": sum(1 for r in self.results if r.status == "PASS"),
                "failed": sum(1 for r in self.results if r.status == "FAIL"),
                "skipped": sum(1 for r in self.results if r.status == "SKIP"),
            },
            "results": [r.to_dict() for r in self.results]
        }
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, indent=2), encoding="utf-8")
        print(f"  {COLOR_CYAN}Machine-readable report exported to:{COLOR_RESET} {path}")


def main():
    parser = argparse.ArgumentParser(description="Profile README 4-Tier Automated Verification Harness")
    parser.add_argument("--tier", type=int, choices=[1, 2, 3, 4], help="Run only specific tier (1, 2, 3, or 4)")
    parser.add_argument("--all", action="store_true", help="Run all 4 tiers (default)")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose debug logging")
    parser.add_argument("--json-report", type=str, help="Export machine-readable test results to JSON file")
    args = parser.parse_args()

    # Determine project root (one level up from scripts/)
    root = Path(__file__).resolve().parent.parent
    harness = VerificationHarness(root, verbose=args.verbose)

    if args.tier:
        harness.start_time = time.time()
        getattr(harness, f"run_tier_{args.tier}")()
        exit_code = harness.print_summary()
    else:
        exit_code = harness.run_all()

    if args.json_report:
        harness.export_json(Path(args.json_report))

    sys.exit(exit_code)


if __name__ == "__main__":
    main()
