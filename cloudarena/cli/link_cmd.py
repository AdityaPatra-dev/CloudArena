"""CLI command to link local cluster environment with cloud Arena Token."""

from typing import Optional
import requests
import typer
from rich.console import Console
from rich.panel import Panel

from cloudarena.core.config import load_config, save_config

console = Console()


def mask_token(token: str) -> str:
    """Mask sensitive token characters for display."""
    if len(token) <= 8:
        return "••••••••"
    return f"{token[:7]}••••••••{token[-4:]}"


def run_link(
    token: str,
    event: Optional[str] = None,
    handle: Optional[str] = None,
):
    """Link local environment to CloudArena web platform using your Personal Arena Token."""
    clean_token = token.strip()
    if len(clean_token) < 8:
        console.print("[bold red]❌ Invalid token format.[/bold red] Arena Token must be at least 8 characters long.")
        raise typer.Exit(code=1)

    config = load_config()
    config.player.arena_token = clean_token
    config.player.is_linked = True
    config.player.solo_mode = False

    if event:
        config.player.event_id = event.strip()
    if handle:
        config.player.handle = handle.strip()

    # Attempt to query server for user profile details if reachable
    server_online = False
    try:
        url = f"{config.central_server_url.rstrip('/')}/api/v1/auth/verify"
        resp = requests.post(url, json={"arena_token": clean_token}, timeout=2.0)
        if resp.status_code == 200:
            server_online = True
            data = resp.json().get("user", {})
            if data.get("handle") and not handle:
                config.player.handle = data["handle"]
            if data.get("email"):
                config.player.email = data["email"]
            if data.get("uid"):
                config.player.user_id = data["uid"]
    except Exception:
        # Offline resilience: proceed with local linkage
        pass

    save_config(config)

    server_status = "[bold green]Online & Verified 🟢[/bold green]" if server_online else "[yellow]Configured (Offline Sync) 🟡[/yellow]"

    console.print(Panel(
        f"[bold green]✓ Successfully Linked to CloudArena Platform![/bold green]\n\n"
        f"• Player Handle: [bold cyan]{config.player.handle}[/bold cyan]\n"
        f"• Arena Token:   [dim]{mask_token(clean_token)}[/dim]\n"
        f"• Bound Event:   [bold yellow]{config.player.event_id or 'Global Arena'}[/bold yellow]\n"
        f"• Cloud Status:  {server_status}\n\n"
        f"Your wave progress and verified scores will now automatically sync to the live cloud leaderboard.\n\n"
        f"Next steps:\n"
        f"  1. [bold cyan]cloudarena start[/bold cyan]           (Spin up your local cluster)\n"
        f"  2. [bold cyan]cloudarena wave start 1[/bold cyan]    (Enter Wave 1 battle)\n"
        f"  3. [bold cyan]cloudarena whoami[/bold cyan]          (Verify connection anytime)",
        title="[bold]Cloud Authentication Link[/bold]",
        border_style="green",
    ))
