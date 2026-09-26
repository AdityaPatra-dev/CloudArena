"""CLI command for inspecting SRE Incident Post-Mortems."""

from pathlib import Path
from typing import Optional
import typer
from rich.console import Console

from cloudarena.core.paths import POSTMORTEMS_DIR
from cloudarena.detection.postmortem import display_postmortem_in_console

console = Console()


def run_postmortem(wave: Optional[int] = None):
    """View generated SRE Incident Post-Mortems and key learnings."""
    if not POSTMORTEMS_DIR.exists():
        console.print("[yellow]No post-mortem reports found. Clear a wave first![/yellow]")
        return

    pattern = f"wave_{wave}_*.md" if wave else "wave_*.md"
    matches = sorted(POSTMORTEMS_DIR.glob(pattern), reverse=True)

    if not matches:
        if wave:
            console.print(f"[yellow]No post-mortem report found for Wave {wave}. Clear Wave {wave} first![/yellow]")
        else:
            console.print("[yellow]No post-mortem reports found. Clear a wave first![/yellow]")
        return

    latest_report = matches[0]
    display_postmortem_in_console(latest_report)
