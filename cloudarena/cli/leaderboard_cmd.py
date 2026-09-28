"""CLI leaderboard command showing tournament event standings for Cadets and Squads."""

from typing import Optional
from rich.console import Console
from rich.table import Table

from cloudarena.backend.database.db import get_leaderboard_standings, get_team_standings
from cloudarena.core.config import load_config
from cloudarena.scoring.sync import fetch_remote_leaderboard, fetch_remote_team_leaderboard

console = Console()


def run_leaderboard(event: Optional[str] = None, teams: bool = False):
    """Display real-time tournament leaderboard standings (Solo Cadets or Squads)."""
    config = load_config()
    target_event = event or config.player.event_id

    if teams:
        _display_team_leaderboard(target_event)
    else:
        _display_solo_leaderboard(target_event)


def _display_solo_leaderboard(target_event: Optional[str]):
    # 1. Try remote server sync first
    standings = fetch_remote_leaderboard(target_event)
    source = "Central Event Server"

    # 2. Fallback to local SQLite database if server is offline
    if standings is None:
        standings = get_leaderboard_standings(event_id=target_event)
        source = "Local Storage (Offline)"

    if not standings:
        console.print(f"[yellow]No leaderboard data available for event '{target_event or 'all'}'.[/yellow]")
        console.print("Start a wave with [bold cyan]cloudarena wave start 1[/bold cyan] to score your first points!")
        return

    table = Table(
        title=f"CloudArena Tournament Leaderboard — Solo Cadets ({source})",
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
            f"@{s['handle']}",
            s.get("event_id") or "solo",
            f"{s.get('waves_cleared', 0)}/8",
            time_str,
            f"{s.get('total_score', 0)} pts",
        )

    console.print(table)


def _display_team_leaderboard(target_event: Optional[str]):
    standings = fetch_remote_team_leaderboard(target_event)
    source = "Central Event Server"

    if standings is None:
        standings = get_team_standings(event_id=target_event)
        source = "Local Storage (Offline)"

    if not standings:
        console.print(f"[yellow]No squad standings available for event '{target_event or 'all'}'.[/yellow]")
        console.print("Enlist in a squad with [bold cyan]cloudarena team join SQUAD_NAME[/bold cyan]!")
        return

    table = Table(
        title=f"CloudArena Squad Standings — Co-op CTF ({source})",
        caption=f"Event: {target_event or 'Global'} • Total Squads: {len(standings)}",
        show_lines=True,
    )
    table.add_column("Rank", style="bold white", justify="center", width=8)
    table.add_column("Squad Name", style="bold magenta", width=22)
    table.add_column("Event", style="dim", width=12)
    table.add_column("Members", justify="center", style="cyan", width=10)
    table.add_column("Waves Cleared", justify="center", width=14)
    table.add_column("Roster", style="dim", width=28)
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

        roster_str = ", ".join(f"@{m.get('handle', '?')} ({m.get('role', 'Op')})" for m in s.get("members", [])[:3])
        if len(s.get("members", [])) > 3:
            roster_str += f" +{len(s['members']) - 3} more"

        table.add_row(
            rank_str,
            s["team_name"],
            s.get("event_id") or "solo",
            str(s.get("member_count", 0)),
            f"{s.get('waves_cleared', 0)}/8",
            roster_str or "No members",
            f"{s.get('total_score', 0)} pts",
        )

    console.print(table)
