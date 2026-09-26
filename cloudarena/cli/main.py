"""Main Typer CLI entrypoint for CloudArena."""

import os
import subprocess
import sys
from typing import Optional
import typer
from rich.console import Console

from cloudarena import __version__
from cloudarena.cli.setup_cmd import run_setup
from cloudarena.cli.status_cmd import run_status
from cloudarena.core.environment import find_binary
from cloudarena.core.paths import KUBECONFIG_FILE, get_extended_path_env

app = typer.Typer(
    name="cloudarena",
    help="🌩️ CloudArena: AI-Powered Cloud Infrastructure Survival Arena",
    no_args_is_help=True,
    add_completion=False,
)
console = Console()


@app.command("setup")
def setup(
    install_tools: bool = typer.Option(
        False,
        "--install-tools",
        "-i",
        help="Auto-install missing k3d & kubectl binaries to ~/.cloudarena/bin without root",
    )
):
    """Inspect environment prerequisites and prepare local tooling."""
    run_setup(install_tools=install_tools)


@app.command("status")
def status():
    """Display current battle status, cluster health, and score."""
    run_status()


@app.command("version")
def version():
    """Display CloudArena version information."""
    console.print(f"[bold cyan]CloudArena[/bold cyan] version [bold green]{__version__}[/bold green]")


@app.command(
    "kubectl",
    context_settings={"allow_extra_args": True, "ignore_unknown_options": True},
)
def kubectl_proxy(ctx: typer.Context):
    """Run kubectl commands safely isolated to the CloudArena cluster."""
    kubectl_bin = find_binary("kubectl")
    if not kubectl_bin:
        console.print("[bold red]kubectl is not installed.[/bold red] Run [bold cyan]cloudarena setup -i[/bold cyan] first.")
        raise typer.Exit(code=1)

    env = get_extended_path_env()
    if KUBECONFIG_FILE.exists():
        env["KUBECONFIG"] = str(KUBECONFIG_FILE)

    cmd = [kubectl_bin] + ctx.args
    try:
        res = subprocess.run(cmd, env=env)
        raise typer.Exit(code=res.returncode)
    except KeyboardInterrupt:
        raise typer.Exit(code=130)


@app.command("start")
def start(
    event: Optional[str] = typer.Option(None, "--event", "-e", help="Event or Tournament ID"),
    player: Optional[str] = typer.Option(None, "--player", "-p", help="Player handle / username"),
):
    """Spin up the 3-node cluster and initialize target workloads."""
    console.print("[yellow]Phase 1 is currently active. Cluster provisioning (Phase 2) will be enabled next.[/yellow]")
    console.print(f"Player: [cyan]{player or 'cadet'}[/cyan] | Event: [cyan]{event or 'solo'}[/cyan]")


@app.command("destroy")
def destroy():
    """Safely tear down the arena cluster and wipe local resources clean."""
    console.print("[yellow]Phase 1 is currently active. Cluster lifecycle manager will be connected in Phase 2.[/yellow]")


@app.command("hint")
def hint():
    """Request progressive guidance from the AI Incident Mentor."""
    console.print("[yellow]Incident Mentor engine will be connected in Phase 5.[/yellow]")


@app.command("reset")
def reset():
    """Instantly reset current wave workloads to their initial baseline."""
    console.print("[yellow]Snapshot reconciliation will be connected in Phase 3.[/yellow]")


if __name__ == "__main__":
    app()
