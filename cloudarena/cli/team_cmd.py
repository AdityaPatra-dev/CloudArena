"""CLI command group for Team & Squad Co-op CTF operations."""

from typing import Optional
import requests
import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from cloudarena.core.config import load_config, save_config

team_app = typer.Typer(
    name="team",
    help="👥 Squad & Co-op CTF Team Operations",
    no_args_is_help=True,
)
console = Console()

VALID_ROLES = [
    "Captain",
    "SRE Lead",
    "Chaos Specialist",
    "Triage Engineer",
    "Platform Architect",
    "Operator",
]


@team_app.command("status")
def team_status():
    """Display current squad membership, team ID, assigned role, and roster."""
    config = load_config()
    player = config.player

    if not player.team_id:
        console.print(Panel(
            "[yellow]You are currently competing as a Solo Cadet.[/yellow]\n\n"
            "To form or join a squad with your fellow engineers:\n"
            "  • [bold cyan]cloudarena team join SQUAD_NAME[/bold cyan]\n"
            "  • [bold cyan]cloudarena team join SQUAD_NAME --role \"SRE Lead\"[/bold cyan]\n\n"
            "Or create a squad code in the CloudArena web dashboard under Competitor Passport.",
            title="[bold]👥 Squad Status[/bold]",
            border_style="yellow",
        ))
        return

    table = Table(show_header=False, box=None)
    table.add_column("Field", style="bold white", width=18)
    table.add_column("Value", style="cyan")

    table.add_row("Squad Name:", f"[bold magenta]{player.team_name or player.team_id}[/bold magenta]")
    table.add_row("Squad Code / ID:", f"[dim]{player.team_id}[/dim]")
    table.add_row("Your Role:", f"[bold green]{player.team_role}[/bold green]")
    table.add_row("Tournament Event:", f"[bold yellow]{player.event_id or 'Global Arena'}[/bold yellow]")
    table.add_row("Player Handle:", f"@{player.handle}")

    # Query central server for teammates if reachable
    server_online = False
    teammates = []
    try:
        url = f"{config.central_server_url.rstrip('/')}/api/v1/teams/roster"
        resp = requests.get(url, params={"team_id": player.team_id}, timeout=2.0)
        if resp.status_code == 200:
            server_online = True
            teammates = resp.json().get("members", [])
    except Exception:
        pass

    sync_status = "[green]Live Sync 🟢[/green]" if server_online else "[yellow]Offline Local 🟡[/yellow]"
    table.add_row("Network Status:", sync_status)

    console.print(Panel(table, title="[bold]👥 Squad Identity Passport[/bold]", border_style="magenta"))

    if teammates:
        roster_table = Table(title="Squad Roster", show_lines=True)
        roster_table.add_column("Competitor", style="bold cyan")
        roster_table.add_column("Assigned Role", style="bold green")
        roster_table.add_column("Score Contribution", justify="right", style="bold yellow")
        for m in teammates:
            roster_table.add_row(f"@{m.get('handle', 'cadet')}", m.get("role", "Operator"), f"{m.get('score', 0)} pts")
        console.print(roster_table)


@team_app.command("join")
def team_join(
    team_id: str = typer.Argument(..., help="Squad Name or unique Squad Code to join"),
    name: Optional[str] = typer.Option(None, "--name", "-n", help="Display name for the squad"),
    role: str = typer.Option("Operator", "--role", "-r", help="Your role (Captain, SRE Lead, Chaos Specialist, Triage Engineer, Operator)"),
):
    """Join or create a team / squad for Co-op CTF mode."""
    config = load_config()
    clean_id = team_id.strip()
    clean_name = name.strip() if name else clean_id
    clean_role = role.strip()

    config.player.team_id = clean_id
    config.player.team_name = clean_name
    config.player.team_role = clean_role
    config.player.solo_mode = False

    # Sync with central server if reachable
    synced = False
    try:
        url = f"{config.central_server_url.rstrip('/')}/api/v1/teams/join"
        payload = {
            "team_id": clean_id,
            "team_name": clean_name,
            "handle": config.player.handle,
            "role": clean_role,
            "event_id": config.player.event_id or "solo",
            "arena_token": config.player.arena_token,
        }
        resp = requests.post(url, json=payload, timeout=2.0)
        if resp.status_code == 200:
            synced = True
    except Exception:
        pass

    save_config(config)

    sync_note = "[bold green]✓ Synced to Central Leaderboard[/bold green]" if synced else "[yellow]✓ Saved locally (will sync on next wave submit)[/yellow]"

    console.print(Panel(
        f"[bold green]✓ Successfully Joined Squad '{clean_name}'![/bold green]\n\n"
        f"• Squad ID:   [bold magenta]{clean_id}[/bold magenta]\n"
        f"• Squad Name: [bold white]{clean_name}[/bold white]\n"
        f"• Your Role:  [bold cyan]{clean_role}[/bold cyan]\n"
        f"• Status:     {sync_note}\n\n"
        f"Your wave clears and incident scores will now aggregate under squad standings on the live leaderboard.",
        title="[bold]Squad Enlistment[/bold]",
        border_style="green",
    ))


@team_app.command("leave")
def team_leave():
    """Leave your current squad and return to Solo Cadet mode."""
    config = load_config()
    old_team = config.player.team_name or config.player.team_id

    if not config.player.team_id:
        console.print("[yellow]You are not currently in any squad.[/yellow]")
        return

    # Notify server if reachable
    try:
        url = f"{config.central_server_url.rstrip('/')}/api/v1/teams/leave"
        payload = {
            "team_id": config.player.team_id,
            "handle": config.player.handle,
            "arena_token": config.player.arena_token,
        }
        requests.post(url, json=payload, timeout=2.0)
    except Exception:
        pass

    config.player.team_id = None
    config.player.team_name = None
    config.player.team_role = "Operator"
    config.player.solo_mode = True
    save_config(config)

    console.print(Panel(
        f"[yellow]You have left squad '[bold]{old_team}[/bold]'.[/yellow]\n\n"
        "Your profile has returned to [bold cyan]Solo Cadet[/bold cyan] mode.",
        title="[bold]Squad Departure[/bold]",
        border_style="yellow",
    ))


@team_app.command("role")
def team_role(
    new_role: str = typer.Argument(..., help="New role: Captain, SRE Lead, Chaos Specialist, Triage Engineer, Operator"),
):
    """Update your operational role inside your squad."""
    config = load_config()
    if not config.player.team_id:
        console.print("[red]❌ You must join a squad first before assigning a squad role.[/red]")
        console.print("Run [bold cyan]cloudarena team join SQUAD_NAME[/bold cyan]")
        raise typer.Exit(code=1)

    clean_role = new_role.strip()
    config.player.team_role = clean_role
    save_config(config)

    # Sync role update to server if available
    try:
        url = f"{config.central_server_url.rstrip('/')}/api/v1/teams/role"
        requests.post(url, json={
            "team_id": config.player.team_id,
            "handle": config.player.handle,
            "role": clean_role,
        }, timeout=2.0)
    except Exception:
        pass

    console.print(f"[bold green]✓ Squad role updated to:[/bold green] [bold cyan]{clean_role}[/bold cyan]")
