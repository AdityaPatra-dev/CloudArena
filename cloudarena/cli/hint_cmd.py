"""CLI command for requesting progressive guidance from the AI Incident Mentor."""

import sys
from typing import Optional
import typer
from rich.console import Console
from rich.panel import Panel

from cloudarena.mentor.engine import MentorEngine

console = Console()


def run_hint(yes: bool = False, force_offline: bool = False):
    """Request progressive guidance for the active incident with point deductions."""
    current_wave, next_level, cost = MentorEngine.get_next_hint_info()

    if current_wave == 0:
        console.print("[yellow]No wave is currently active.[/yellow] Run [bold cyan]cloudarena wave start[/bold cyan] to begin a challenge.")
        return

    if next_level > 3:
        console.print(f"[yellow]You have already utilized all 3 hints for Wave {current_wave}.[/yellow]")
        console.print("Rely on your telemetry and `cloudarena kubectl` commands to crack the incident!")
        return

    tier_names = {1: "Directional Clue", 2: "Component Diagnostic", 3: "Tactical Solution Clue"}
    tier_desc = tier_names.get(next_level, "Guidance")

    console.print(Panel.fit(
        f"[bold cyan]🤖 CloudArena AI Incident Mentor[/bold cyan]\n"
        f"Active Incident: [bold white]Wave {current_wave}[/bold white] | Requesting: [bold yellow]Level {next_level} ({tier_desc})[/bold yellow]\n\n"
        f"[bold red]⚠️ Penalty: This hint will deduct {cost} points from your wave score.[/bold red]"
    ))

    if not yes:
        if sys.stdin.isatty():
            confirm = typer.confirm("Do you want to proceed and reveal this hint?", default=False)
            if not confirm:
                console.print("[dim]Hint request cancelled. No points deducted.[/dim]")
                return
        else:
            console.print("[dim]Non-interactive environment: proceed with hint request.[/dim]")

    with console.status("[bold cyan]Consulting Incident Mentor knowledge base...[/bold cyan]"):
        hint, source = MentorEngine.request_hint(force_offline=force_offline)

    if not hint:
        console.print(f"[bold red]Unable to retrieve hint:[/bold red] {source}")
        return

    content_text = f"{hint.content}\n"
    if hint.suggested_command:
        content_text += f"\n[bold white]Suggested Diagnostic Command:[/bold white]\n[bold green]{hint.suggested_command}[/bold green]\n"

    content_text += f"\n[dim]Source: {source} | Deducted: -{hint.cost_pts} pts | Hints used: {next_level}/3[/dim]"

    console.print(Panel(
        content_text,
        title=f"[bold green]💡 Level {hint.level} Hint: {hint.title}[/bold green]",
        border_style="green",
    ))
