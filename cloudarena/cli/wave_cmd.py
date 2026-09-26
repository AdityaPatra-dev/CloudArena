"""CLI subcommands for managing attack waves."""

import time
from typing import Optional
import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from cloudarena.attacks.manager import (
    check_wave_resolution,
    launch_wave,
    list_all_attacks,
    rollback_wave,
)
from cloudarena.core.config import load_config, save_config

wave_app = typer.Typer(
    name="wave",
    help="⚔️ Manage attack waves and monitor active incidents.",
    no_args_is_help=True,
)
console = Console()


@wave_app.command("start")
def start_wave(
    wave: Optional[int] = typer.Argument(None, help="Wave number to launch (1 to 4). Defaults to next uncompleted wave.")
):
    """Initiate an infrastructure attack wave."""
    config = load_config()

    if wave is None:
        wave = config.game.current_wave if config.game.current_wave > 0 else 1

    if wave < 1 or wave > 4:
        console.print("[bold red]Invalid wave number.[/bold red] Available waves: 1, 2, 3, 4.")
        raise typer.Exit(code=1)

    with console.status(f"[bold red]Injecting chaos for Wave {wave}...[/bold red]"):
        try:
            info = launch_wave(wave)
        except Exception as e:
            console.print(f"[bold red]❌ Failed to initiate wave {wave}:[/bold red] {e}")
            raise typer.Exit(code=1)

    console.print(Panel(
        f"[bold red]⚠️ INCIDENT ACTIVE: {info.title}[/bold red]\n"
        f"Difficulty: [yellow]{info.difficulty}[/yellow]\n\n"
        f"[bold white]Description:[/bold white]\n{info.description}\n\n"
        f"[bold white]Observed Symptoms:[/bold white]\n[yellow]{info.symptoms}[/yellow]\n\n"
        f"[dim]Your mission: Investigate using `cloudarena kubectl ...`, find the root cause, and restore health.[/dim]\n"
        f"[dim]Check status anytime: `cloudarena wave status` | Need help? `cloudarena hint`[/dim]",
        title=f"[bold red]⚔️ Wave {wave} Injected[/bold red]",
        border_style="red",
    ))


@wave_app.command("status")
def status_wave():
    """Check whether the active incident has been successfully resolved."""
    config = load_config()
    current_wave = config.game.current_wave
    if current_wave == 0:
        console.print("[yellow]No wave is currently active.[/yellow] Run [bold cyan]cloudarena wave start[/bold cyan] to launch Wave 1.")
        return

    elapsed_str = "0s"
    if config.game.wave_start_time:
        elapsed = int(time.time() - config.game.wave_start_time)
        mins, secs = divmod(elapsed, 60)
        elapsed_str = f"{mins}m {secs}s"

    with console.status(f"[bold cyan]Inspecting cluster for Wave {current_wave} resolution...[/bold cyan]"):
        resolved, reason = check_wave_resolution(current_wave)

    if resolved:
        console.print(Panel(
            f"[bold green]🎉 WAVE {current_wave} RESOLVED![/bold green]\n\n"
            f"{reason}\n"
            f"Time elapsed: [cyan]{elapsed_str}[/cyan]\n"
            f"Hints used: [yellow]{config.game.hints_used_in_wave}[/yellow]\n\n"
            f"Run [bold cyan]cloudarena wave start {current_wave + 1}[/bold cyan] to proceed to the next challenge!",
            title=f"[bold green]✓ Wave {current_wave} Success[/bold green]",
            border_style="green",
        ))
    else:
        console.print(Panel(
            f"[bold yellow]⚠️ Incident Still Unresolved[/bold yellow]\n\n"
            f"Current Wave: [bold cyan]Wave {current_wave}[/bold cyan]\n"
            f"Time elapsed: [cyan]{elapsed_str}[/cyan]\n"
            f"Diagnostic status: [red]{reason}[/red]\n\n"
            f"Use [bold cyan]cloudarena kubectl get pods -A[/bold cyan] and [bold cyan]cloudarena kubectl describe ...[/bold cyan] to troubleshoot.",
            title=f"[bold yellow]Wave {current_wave} In Progress[/bold yellow]",
            border_style="yellow",
        ))


@wave_app.command("rollback")
def rollback(wave: Optional[int] = typer.Argument(None, help="Wave number to rollback")):
    """Cancel and roll back the active attack wave."""
    config = load_config()
    target_wave = wave or config.game.current_wave
    if target_wave == 0:
        console.print("[yellow]No active wave to rollback.[/yellow]")
        return

    with console.status(f"[bold yellow]Rolling back Wave {target_wave}...[/bold yellow]"):
        try:
            rollback_wave(target_wave)
            console.print(f"[bold green]✓ Wave {target_wave} rolled back successfully.[/bold green]")
        except Exception as e:
            console.print(f"[bold red]❌ Rollback error:[/bold red] {e}")


@wave_app.command("list")
def list_waves():
    """List all available attack wave challenges."""
    config = load_config()
    attacks = list_all_attacks()

    table = Table(title="CloudArena Attack Waves", show_lines=True)
    table.add_column("Wave", style="bold cyan", width=6)
    table.add_column("Title", style="bold white", width=30)
    table.add_column("Difficulty", width=14)
    table.add_column("Status", width=12)

    for atk in attacks:
        if atk.wave_number in config.game.completed_waves:
            status = "[bold green]Cleared[/bold green]"
        elif atk.wave_number == config.game.current_wave:
            status = "[bold yellow]Active[/bold yellow]"
        else:
            status = "[dim]Locked[/dim]"

        table.add_row(f"Wave {atk.wave_number}", atk.title, atk.difficulty, status)

    console.print(table)
