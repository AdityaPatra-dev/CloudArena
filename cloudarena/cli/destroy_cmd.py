"""CLI destroy command implementation for tearing down the arena cluster."""

import sys
import typer
from rich.console import Console
from rich.panel import Panel

from cloudarena.core.config import load_config, save_config
from cloudarena.k8s.cluster import delete_cluster, is_cluster_running

console = Console()


def run_destroy(force: bool = False):
    """Safely tear down the arena cluster and remove all temporary state."""
    config = load_config()
    cluster_name = config.cluster.cluster_name

    console.print(Panel.fit(f"[bold red]💥 CloudArena Teardown: '{cluster_name}'[/bold red]"))

    if not is_cluster_running(cluster_name) and not config.cluster.is_created:
        console.print(f"[yellow]Cluster '{cluster_name}' is not currently running or has already been removed.[/yellow]")
        return

    if not force:
        if sys.stdin.isatty():
            confirm = typer.confirm(
                f"Are you sure you want to completely destroy the cluster '{cluster_name}' and all its data?",
                default=False,
            )
            if not confirm:
                console.print("[dim]Teardown cancelled.[/dim]")
                return
        else:
            console.print("[dim]Non-interactive mode: proceeding with teardown (--force assumed).[/dim]")

    with console.status(f"[bold red]Deleting cluster '{cluster_name}' and wiping containers/networks...[/bold red]"):
        try:
            delete_cluster(cluster_name)
            config.cluster.is_created = False
            save_config(config)
            console.print(f"[bold green]✓ Cluster '{cluster_name}' and associated resources wiped clean.[/bold green]")
        except Exception as e:
            console.print(f"[bold red]❌ Error during teardown:[/bold red] {e}")
            raise typer.Exit(code=1)
