"""CLI reset command for instantaneous declarative snapshot recovery."""

import typer
from rich.console import Console
from rich.panel import Panel

from cloudarena.attacks.manager import reset_wave_environment
from cloudarena.core.config import load_config

console = Console()


def run_reset():
    """Instantly reconcile the current wave environment to baseline state."""
    config = load_config()
    current_wave = config.game.current_wave

    if current_wave == 0:
        console.print("[yellow]No wave has been started yet.[/yellow] Run [bold cyan]cloudarena wave start 1[/bold cyan] first.")
        return

    console.print(Panel.fit(f"[bold yellow]🔄 Resetting Wave {current_wave} Environment[/bold yellow]"))

    with console.status(f"[bold green]Reconciling cluster manifests and re-priming Wave {current_wave}...[/bold green]"):
        try:
            reset_wave_environment(current_wave)
            console.print(Panel(
                f"[bold green]✓ Snapshot reset complete in < 3 seconds![/bold green]\n\n"
                f"• Clean microservices manifests restored in `cloudarena-app`.\n"
                f"• Wave {current_wave} failure conditions re-injected.\n"
                f"• Timer and hints reset for a fresh attempt.\n\n"
                f"Check status anytime: [bold cyan]cloudarena wave status[/bold cyan]",
                title=f"[bold green]Wave {current_wave} Baseline Restored[/bold green]",
                border_style="green",
            ))
        except Exception as e:
            console.print(f"[bold red]❌ Snapshot reset failed:[/bold red] {e}")
            raise typer.Exit(code=1)
