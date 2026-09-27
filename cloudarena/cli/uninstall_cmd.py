"""CLI uninstall command for cleanly removing CloudArena clusters, state, and binaries."""

import shutil
import sys
from pathlib import Path
import typer
from rich.console import Console
from rich.panel import Panel

from cloudarena.core.config import load_config
from cloudarena.core.paths import CLOUDARENA_HOME
from cloudarena.k8s.cluster import delete_cluster, is_cluster_running

console = Console()


def run_uninstall(force: bool = False):
    """Safely tear down any active clusters and wipe all CloudArena data from the laptop."""
    console.print(Panel.fit(
        "[bold red]🗑️ CloudArena Complete Teardown & Uninstall[/bold red]\n"
        "[dim]This will remove the local cluster, all downloaded tools, databases, and configs.[/dim]"
    ))

    if not force:
        if sys.stdin.isatty():
            confirm = typer.confirm(
                "Are you sure you want to stop all containers and wipe ~/.cloudarena completely?",
                default=False,
            )
            if not confirm:
                console.print("[dim]Uninstall cancelled.[/dim]")
                return

    # 1. Stop and remove k3d cluster if running
    config = load_config()
    cluster_name = config.cluster.cluster_name
    if is_cluster_running(cluster_name):
        with console.status(f"[bold red]Destroying cluster '{cluster_name}'...[/bold red]"):
            try:
                delete_cluster(cluster_name)
                console.print(f"[bold green]✓ Cluster '{cluster_name}' destroyed.[/bold green]")
            except Exception as e:
                console.print(f"[yellow]⚠️ Could not destroy cluster: {e}[/yellow]")

    # 2. Wipe ~/.cloudarena directory
    if CLOUDARENA_HOME.exists():
        with console.status("[bold red]Wiping ~/.cloudarena data directory...[/bold red]"):
            try:
                shutil.rmtree(CLOUDARENA_HOME)
                console.print("[bold green]✓ ~/.cloudarena and local binaries wiped clean.[/bold green]")
            except Exception as e:
                console.print(f"[yellow]⚠️ Error removing ~/.cloudarena: {e}[/yellow]")

    # 3. Remove symlink from ~/.local/bin/cloudarena if present
    local_bin = Path.home() / ".local" / "bin" / "cloudarena"
    if local_bin.is_symlink() or local_bin.exists():
        try:
            local_bin.unlink()
            console.print("[bold green]✓ Symlink ~/.local/bin/cloudarena removed.[/bold green]")
        except Exception:
            pass

    console.print(Panel(
        "[bold green]✓ CloudArena has been completely removed from your laptop![/bold green]\n\n"
        "All Docker containers, networks, downloaded binaries, and local databases were wiped.\n\n"
        "To uninstall the Python CLI package itself:\n"
        "  [bold cyan]pip uninstall -y cloudarena[/bold cyan]\n\n"
        "Thank you for playing CloudArena! 🌩️",
        title="[bold]Clean Uninstall Complete[/bold]",
        border_style="green",
    ))
