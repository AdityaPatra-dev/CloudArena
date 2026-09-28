"""CLI leaderboard command showing tournament event standings."""

from typing import Optional
import typer
from rich.console import Console
from rich.table import Table

from cloudarena.backend.database.db import get_leaderboard_standings
from cloudarena.core.config import load_config
from cloudarena.scoring.sync import fetch_remote_leaderboard

console = Console()


def run_leaderboard(event: Optional[str] = None):
    """Display real-time tournament leaderboard standings."""
    config = load_config()
    target_event = event or config.player.event_id

    # 1. Try remote server sync first
    standings = fetch_remote_leaderboard(target_event)
    source = "Central Event Server"

    # 2. Fallback to local SQLite database if server is offline
    if standings is None:
        standings = get_leaderboard_standings(event_id=target_event)
        source = "Local Storage (Offline)"

    if not standings:
        console.print(f"[yellow]No leaderboard data available for event '{target_event or 'all'}'.[/yellow]")
        console.print("Start a wave with [bold cyan]cloudarena wave start[/bold cyan] to score your first points!")
        return

    table = Table(
        title=f"CloudArena Tournament Leaderboard ({source})",
        caption=f"Event: {target_event or 'Global'} • Total Competitors: {len(standings)}",
        show_lines=True,
    )
    table.add_column("Rank", style="bold white", justify="center", width=8)
    table.add_column("Competitor", style="bold cyan", width=20)
    table.add_column("Event", style="dim", width=14)
    table.add_column("Waves Cleared", justify="center", width=16)
    table.add_column("Total Time", justify="right", style="dim", width=12)
    table.add_column("Total Score", justify="right", style="bold green", width=14)

    for s in standings:
        rank = s["rank"]
        rank_str = f"#{rank}"
        if rank == 1:
            rank_str = "🥇 1st"
        elif rank == 2:
            rank_str = "🥈 2nd"
        elif rank == 3:
            rank_str = "🥉 3rd"

        mins, secs = divmod(s["total_time"], 60)
        time_str = f"{mins}m {secs}s"

        table.add_row(
            rank_str,
            s["handle"],
            s["event_id"] or "solo",
            f"{s['waves_cleared']}/4",
            time_str,
            f"{s['total_score']} pts",
        )

    console.print(table)

