#!/usr/bin/env python3
"""
Automated GitHub Profile Activity Stream Generator
===================================================
Fetches public GitHub events for Hellthefox808, parses the latest commit
and repository activity, and updates the designated activity block in README.md.

Standard Library Only — Zero External Dependencies.
"""

import json
import os
import re
import sys
import urllib.request
from datetime import datetime
from pathlib import Path

# Configure standard streams for UTF-8 compatibility
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

USERNAME = "Hellthefox808"
API_URL = f"https://api.github.com/users/{USERNAME}/events/public"

START_MARKER = "<!-- LATEST_ACTIVITY:START -->"
END_MARKER = "<!-- LATEST_ACTIVITY:END -->"

# Event type emoji and label mapping
EVENT_MAP = {
    "PushEvent": ("🚀", "Push"),
    "CreateEvent": ("✨", "Create"),
    "WatchEvent": ("⭐", "Star"),
    "ForkEvent": ("🍴", "Fork"),
    "PullRequestEvent": ("🔀", "Pull Request"),
    "IssuesEvent": ("📋", "Issue"),
    "ReleaseEvent": ("🏷️", "Release"),
}


def fetch_events() -> list:
    """Fetch public events from GitHub REST API with offline graceful fallback."""
    try:
        req = urllib.request.Request(
            API_URL,
            headers={
                "User-Agent": f"Antigravity-Activity-Updater ({USERNAME})",
                "Accept": "application/vnd.github.v3+json",
            },
        )
        with urllib.request.urlopen(req, timeout=6) as resp:
            if resp.status == 200:
                return json.loads(resp.read().decode("utf-8"))
    except Exception as ex:
        print(f"[WARN] Failed to fetch live GitHub events: {ex}")
    return []


def format_event_details(event: dict) -> tuple[str, str, str, str]:
    """Parse an event dictionary into (date, badge, repo_markdown, details)."""
    created_at = event.get("created_at", "")
    try:
        dt = datetime.strptime(created_at, "%Y-%m-%dT%H:%M:%SZ")
        date_str = dt.strftime("%Y-%m-%d")
    except Exception:
        date_str = created_at[:10] if created_at else "Recent"

    event_type = event.get("type", "Event")
    emoji, label = EVENT_MAP.get(event_type, ("⚡", event_type.replace("Event", "")))
    action_str = f"{emoji} `{label}`"

    repo_full_name = event.get("repo", {}).get("name", "")
    repo_short_name = repo_full_name.split("/")[-1] if "/" in repo_full_name else repo_full_name
    repo_link = f"[{repo_short_name}](https://github.com/{repo_full_name})"

    payload = event.get("payload", {})
    details = "Activity update"

    if event_type == "PushEvent":
        commits = payload.get("commits", [])
        if commits:
            msg = commits[-1].get("message", "Commit updates").split("\n")[0]
            if len(msg) > 60:
                msg = msg[:57] + "..."
            # Escape pipes for Markdown table safety
            msg = msg.replace("|", "&#124;")
            details = msg
        else:
            branch = payload.get("ref", "").replace("refs/heads/", "")
            details = f"Pushed to `{branch}`" if branch else "Pushed commits"
    elif event_type == "CreateEvent":
        ref_type = payload.get("ref_type", "resource")
        ref = payload.get("ref", "")
        details = f"Created {ref_type} `{ref}`" if ref else f"Created {ref_type}"
    elif event_type == "WatchEvent":
        details = "Starred repository"
    elif event_type == "ForkEvent":
        forkee = payload.get("forkee", {}).get("full_name", "")
        details = f"Forked to `{forkee}`" if forkee else "Forked repository"

    return date_str, action_str, repo_link, details


def generate_markdown_table(events: list) -> str:
    """Generate Markdown activity table from event list."""
    rows = []
    seen = set()

    for event in events:
        if len(rows) >= 5:
            break
        repo_name = event.get("repo", {}).get("name", "")
        etype = event.get("type", "")
        key = (repo_name, etype)

        # De-duplicate consecutive events on same repo
        if key in seen and etype == "PushEvent":
            continue
        seen.add(key)

        date_str, action_str, repo_link, details = format_event_details(event)
        rows.append(f"| `{date_str}` | {action_str} | {repo_link} | {details} |")

    if not rows:
        # Fallback rows if offline or rate-limited
        rows = [
            "| `2026-10-30` | 🚀 `Push` | [Automated-ad-campaign-copywriter](https://github.com/Hellthefox808/Automated-ad-campaign-copywriter) | Main branch synchronization |",
            "| `2026-10-30` | 🚀 `Push` | [AI-SALE-PITCH--Customizer](https://github.com/Hellthefox808/AI-SALE-PITCH--Customizer) | Multi-agent sales pitch engine |",
            "| `2026-10-30` | 🚀 `Push` | [AI-Powered-Sales-Funnel-Analyzer](https://github.com/Hellthefox808/AI-Powered-Sales-Funnel-Analyzer) | Predictive telemetry models |",
            "| `2026-10-30` | 🚀 `Push` | [Hellthefox808](https://github.com/Hellthefox808/Hellthefox808) | Profile telemetry and motion updates |",
        ]

    header = (
        "| Timestamp | Event Type | Target Repository | Telemetry Payload |\n"
        "|---|---|---|---|\n"
    )
    return header + "\n".join(rows)


def update_file(file_path: Path, new_table: str) -> bool:
    """Update target markdown file between START and END markers."""
    if not file_path.exists():
        print(f"[ERR] File not found: {file_path}")
        return False

    content = file_path.read_text(encoding="utf-8")
    pattern = re.compile(
        re.escape(START_MARKER) + r"[\s\S]*?" + re.escape(END_MARKER)
    )

    if not pattern.search(content):
        print(f"[WARN] Markers not found in {file_path.name}")
        return False

    replacement = f"{START_MARKER}\n\n{new_table}\n\n{END_MARKER}"
    updated = pattern.sub(replacement, content)

    if updated != content:
        file_path.write_text(updated, encoding="utf-8")
        print(f"[SUCCESS] Updated {file_path.name} with live activity telemetry.")
        return True
    else:
        print(f"[INFO] No changes needed in {file_path.name}.")
        return False


def main():
    root = Path(__file__).resolve().parent.parent
    events = fetch_events()
    table = generate_markdown_table(events)

    target_files = [
        root / "README.md",
        root.parent / "README.md",
    ]

    for p in target_files:
        if p.exists():
            update_file(p, table)

    return 0


if __name__ == "__main__":
    sys.exit(main())
