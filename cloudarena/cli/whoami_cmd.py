"""CLI whoami command displaying authenticated user identity and cloud linkage."""

from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from cloudarena.cli.link_cmd import mask_token
from cloudarena.core.config import load_config

console = Console()


def run_whoami():
    """Display current competitor profile, cloud linkage status, and tournament binding."""
    config = load_config()

    console.print(Panel.fit("[bold cyan]🪪 CloudArena Identity Passport[/bold cyan]"))

    table = Table(show_header=False, box=None)
    table.add_column("Field", style="bold white", width=22)
    table.add_column("Value", style="cyan")

    table.add_row("Player Handle:", f"[bold white]{config.player.handle}[/bold white]")
    table.add_row("Cloud Linked:", "[bold green]Linked 🟢[/bold green]" if config.player.is_linked else "[yellow]Unlinked (Solo Mode)[/yellow]")
    
    if config.player.arena_token:
        table.add_row("Arena Token:", mask_token(config.player.arena_token))

    table.add_row("Tournament Event:", f"[bold yellow]{config.player.event_id or 'None (Open Arena)'}[/bold yellow]")
    if config.player.team_id:
        table.add_row("Team / Squad:", f"[bold magenta]{config.player.team_id}[/bold magenta]")

    table.add_row("Career Score:", f"[bold green]{config.game.total_score} pts[/bold green]")
    table.add_row("Current Wave:", f"Wave {config.game.current_wave}" if config.game.current_wave > 0 else "Not active")
    table.add_row("Cleared Waves:", ", ".join(f"Wave {w}" for w in config.game.completed_waves) or "None")

    console.print(Panel(table, border_style="cyan"))
