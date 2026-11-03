# ANTIGRAVITY Infrastructure Architecture & System Flow Specification

## 01 // Executive Summary & Control Plane Mandate

This specification documents the enterprise infrastructure, CI/CD telemetry orchestration, SRE controls, and security boundary governance powering Ravi Ranjan Singh's GitHub Profile ecosystem (`Hellthefox808/Hellthefox808`).

Adhering to the **Elite Engineering Operating System** (`/system-like-fabel`) and the **Master Infrastructure Orchestrator** (`/infra-flow`), this system optimizes for:

$$\text{Correctness} > \text{Evidence} > \text{Safety} > \text{Maintainability} > \text{Reliability} > \text{Performance}$$

Every component operates with **Zero-Dependency Root Hygiene** (Python 3.11+ standard library only; zero npm/Cargo/Gradle build pollution in repository root) and enforces deterministic fallback states for 100% high-availability uptime.

---

## 02 // Architectural Decision Record (ADR-001)

### Status
Accepted & Deployed (`main` branch).

### Context
GitHub profile READMEs render statically within GitHub's server-side markdown sanitizer (`camo.githubusercontent.com`). However, contemporary engineering leadership requires displaying dynamic activity feeds, live repository stars, real-time contribution velocity, and high-fidelity 4D interactive motion simulations.

### Decision
Implement a **Dual-Plane Hybrid Architecture**:
1. **Cloud Automation Plane (GitHub Actions)**:
   - Headless background runners executing scheduled Cron jobs (6-hour and 12-hour cycles).
   - Automated generation of contribution grid animations targeting an isolated orphan branch (`output`).
   - Self-updating live activity ingestion with automated commits and pull-through synchronization.
2. **Local Client-Side 4D Engine Plane (`motion-preview/`)**:
   - Zero-dependency HTML5 Canvas 2D + Web Audio API synthesizer.
   - Client-side interactive CLI command console (`CyberTerminal`).
   - Hot-swappable visual cyber themes with zero external CDN dependencies.

### Consequences & Trade-offs
- **Pros**: Zero third-party SaaS hosting costs; full data ownership; immune to vendor shutdown; verified 100% offline-first compatibility.
- **Cons**: Requires explicit GitHub API quota budget management and branch isolation for generated dynamic media.

---

## 03 // Infrastructure Topology & Data Flow

The following data flow diagram illustrates the end-to-end ingestion, transformation, verification, and rendering pipeline:

```text
+-----------------------------------------------------------------------------------------+
|                                    GITHUB CLOUD FABRIC                                  |
|                                                                                         |
|   +-----------------------+                    +------------------------------------+   |
|   | GitHub REST API       |                    | GitHub Actions Runner (Ubuntu)     |   |
|   | api.github.com        |                    | cron: "0 */6 * * *"                |   |
|   +-----------+-----------+                    +------------------+-----------------+   |
|               |                                                   |                     |
|               | (Authenticated GET /events/public)               | (Executes)          |
|               v                                                   v                     |
|   +-----------+-----------+                    +------------------+-----------------+   |
|   | Quota Telemetry       |                    | scripts/update_activity.py         |   |
|   | X-RateLimit-Remaining |                    | Standard Library Parser            |   |
|   +-----------+-----------+                    +------------------+-----------------+   |
|               |                                                   |                     |
|               +----------------------->+<-------------------------+                     |
|                                        |                                                |
|                                        v                                                |
|                        +---------------+---------------+                                |
|                        | Atomic Markdown Transformer   |                                |
|                        | Regex Block Marker Injection  |                                |
|                        +---------------+---------------+                                |
|                                        |                                                |
|                     +------------------+------------------+                             |
|                     |                                     |                             |
|                     v (If Changed)                        v (Zero Delta)                |
|       +-------------+-------------+         +-------------+-------------+               |
|       | Git Commit [skip ci]      |         | Terminate Gracefully      |               |
|       | push origin main          |         | 0 Exit Code               |               |
|       +-------------+-------------+         +---------------------------+               |
|                     |                                                                   |
+---------------------|-------------------------------------------------------------------+
                      |
                      v
+-----------------------------------------------------------------------------------------+
|                                 CONSUMER VIEWPORT TIER                                  |
|                                                                                         |
|   +-------------------------------+             +-----------------------------------+   |
|   | GitHub Web Profile (Camo CDN) |             | Local 4D Motion Preview Engine    |   |
|   | - Dynamic Activity Feed       |             | - High-DPI Spatial Canvas 2D      |   |
|   | - Contribution Snake (<pict>) |             | - CyberAudio Synthesizer (Synth)  |   |
|   | - Shields.io Telemetry Badges |             | - CyberTerminal CLI Console       |   |
|   | - Local SVG Fallback Cards    |             | - Hot-Swappable Theme Matrix      |   |
|   +-------------------------------+             +-----------------------------------+   |
+-----------------------------------------------------------------------------------------+
```

---

## 04 // SRE, Reliability & Observability Governance

### 1. Service Level Indicators (SLIs) & Objectives (SLOs)
- **Telemetry Freshness (SLO: 99.0%)**: Activity table updated within 6 hours of public activity.
- **Verification Gate Integrity (SLO: 100%)**: Zero commits reach `main` unless all 60 tests in `scripts/verify.py` pass.
- **Local Fallback Resilience (SLO: 100%)**: If GitHub REST API is unavailable or rate-limited, local baseline telemetry is served with zero broken markdown tables.

### 2. GitHub API Quota Budget Management
The activity update daemon (`scripts/update_activity.py`) dynamically reads and logs GitHub API quota headers:
- `X-RateLimit-Limit`: Maximum allowable requests per hour (60 anonymous / 1,000+ authenticated).
- `X-RateLimit-Remaining`: Remaining request tokens in current window.
- `X-RateLimit-Reset`: UTC epoch timestamp indicating token bucket refresh.

### 3. Failure Domain Classification
When an execution anomaly occurs, the system tags the event into one of five deterministic categories:
- `RATE_LIMITED`: HTTP 403 with quota exhaustion; triggers cached baseline telemetry.
- `NETWORK_UNAVAILABLE`: DNS or socket timeout; triggers cached baseline telemetry.
- `PARSE_FAILURE`: Malformed JSON or unexpected upstream API changes.
- `MARKER_MISSING`: Target file missing `<!-- LATEST_ACTIVITY:START -->` delimiter.
- `ZERO_DELTA`: Telemetry payload identical to current state; commit aborted to prevent commit log pollution.

---

## 05 // DevSecOps & Security Posture

### 1. GitHub Token Principle of Least Privilege
Workflows declare explicit permission blocks:
```yaml
permissions:
  contents: write
```
No additional capabilities (such as `id-token`, `issues`, `pull-requests`, or `actions`) are granted.

### 2. Concurrency Lock & Race Prevention
All three CI/CD pipelines enforce mutual exclusion locks via GitHub Actions `concurrency`:
```yaml
concurrency:
  group: <pipeline-name>-${{ github.ref }}
  cancel-in-progress: true
```
This guarantees that overlapping scheduled runs or manual dispatches never cause merge conflicts or git index corruption.

### 3. GFM Sanitizer Boundary Protection
GitHub's frontend strips dangerous active elements (`<script>`, `<style>`, `<iframe>`, `<object>`, `<embed>`). The profile suite:
- Excludes all active script tags from markdown files.
- Uses declarative SVG SMIL animations for vector motion.
- Confines interactive JavaScript and Web Audio strictly to the local inspection sandbox (`motion-preview/`).

### 4. Zero Secrets Commitment
- Zero credentials, personal access tokens, or private endpoints are hardcoded or checked into git history.
- Workflows rely strictly on GitHub's built-in ephemeral `secrets.GITHUB_TOKEN`.

---

## 06 // Disaster Recovery & Rollback Runbook

### Scenario A: Upstream GitHub Actions Pipeline Failure
1. Check GitHub Actions status tab: `https://github.com/Hellthefox808/Hellthefox808/actions`.
2. Inspect step log under `Sync Live GitHub Telemetry Feed`.
3. If runner fails due to rate limits or API disruption, run locally:
   ```bash
   python scripts/update_activity.py
   python scripts/verify.py --all
   ```
4. If verified, push manually to `origin main`.

### Scenario B: Contribution Snake Output Corruption
1. The snake workflow deploys to an isolated orphan branch named `output`.
2. In the event of artifact corruption on branch `output`:
   ```bash
   git push origin --delete output
   ```
3. Trigger `.github/workflows/snake.yml` via `workflow_dispatch` to regenerate clean SVGs.

### Scenario C: Fast Git Rollback
```bash
git checkout main
git revert HEAD --no-edit
python scripts/verify.py --all
git push origin main
```

---

## 07 // Quality Gate Verification Traceability Matrix

Every pull request and commit must satisfy the authoritative 60-test verification suite:

| Tier | Category | Scope | Test Count | Target Gate |
|---|---|---|---|---|
| Tier 1 | Feature Coverage | Standalone SVG XML, 12 Sections, Motion Engine, Asset Parity | 25 Tests | 100% Pass Required |
| Tier 2 | Boundary & Corner Cases | Alt text, Case-Sensitivity, POSIX Paths, GFM Sanitizer | 25 Tests | 100% Pass Required |
| Tier 3 | Cross-Feature Integration | 4-Way Asset Parity, Aspect Ratios, URL Cross-Check | 5 Tests | 100% Pass Required |
| Tier 4 | Real-World Scenarios | CDN Independence, Whitespace Hygiene, WCAG AAA Contrast | 5 Tests | 100% Pass Required |
| **Total** | **All 4 Tiers** | **Comprehensive System Gate** | **60 Tests** | **100% Pass (0 Failures)** |

Verification Command:
```bash
python scripts/verify.py --all
```
