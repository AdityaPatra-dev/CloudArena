"""Main Typer CLI entrypoint for CloudArena."""

import os
import subprocess
import sys
from typing import Optional
import typer
from rich.console import Console

from cloudarena import __version__
from cloudarena.cli.destroy_cmd import run_destroy
from cloudarena.cli.hint_cmd import run_hint
from cloudarena.cli.leaderboard_cmd import run_leaderboard
from cloudarena.cli.link_cmd import run_link
from cloudarena.cli.postmortem_cmd import run_postmortem
from cloudarena.cli.reset_cmd import run_reset
from cloudarena.cli.server_cmd import server_app
from cloudarena.cli.setup_cmd import run_setup
from cloudarena.cli.start_cmd import run_start
from cloudarena.cli.status_cmd import run_status
from cloudarena.cli.wave_cmd import wave_app
from cloudarena.cli.whoami_cmd import run_whoami
from cloudarena.core.environment import find_binary
from cloudarena.core.paths import KUBECONFIG_FILE, get_extended_path_env

app = typer.Typer(
    name="cloudarena",
    help="🌩️ CloudArena: AI-Powered Cloud Infrastructure Survival Arena",
    no_args_is_help=True,
    add_completion=False,
)
app.add_typer(wave_app, name="wave")
app.add_typer(server_app, name="server")
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
    workers: int = typer.Option(2, "--workers", "-w", help="Number of worker nodes to provision"),
    skip_deploy: bool = typer.Option(False, "--skip-deploy", help="Skip deploying base microservice manifests"),
):
    """Spin up the 3-node cluster and initialize target workloads."""
    run_start(event=event, player=player, workers=workers, skip_deploy=skip_deploy)


@app.command("destroy")
def destroy(
    force: bool = typer.Option(False, "--force", "-f", help="Force deletion without confirmation prompt"),
):
    """Safely tear down the arena cluster and wipe local resources clean."""
    run_destroy(force=force)


@app.command("hint")
def hint(
    yes: bool = typer.Option(False, "--yes", "-y", help="Confirm point deduction automatically without prompt"),
    force_offline: bool = typer.Option(False, "--offline", help="Use local rule catalog without attempting LLM query"),
):
    """Request progressive guidance from the AI Incident Mentor."""
    run_hint(yes=yes, force_offline=force_offline)


@app.command("reset")
def reset():
    """Instantly reset current wave workloads to their initial baseline."""
    run_reset()


@app.command("postmortem")
def postmortem(
    wave: Optional[int] = typer.Argument(None, help="Wave number to inspect (1 to 4). Defaults to latest."),
):
    """View SRE Incident Post-Mortems and key architectural learnings."""
    run_postmortem(wave=wave)


@app.command("leaderboard")
def leaderboard(
    event: Optional[str] = typer.Option(None, "--event", "-e", help="Filter standings by tournament event ID"),
):
    """Display real-time tournament leaderboard standings."""
    run_leaderboard(event=event)


@app.command("link")
def link(
    token: str = typer.Argument(..., help="Your personal Arena Token from the CloudArena web dashboard"),
    event: Optional[str] = typer.Option(None, "--event", "-e", help="Tournament event code to join"),
    handle: Optional[str] = typer.Option(None, "--handle", "-u", help="Gamer handle / username override"),
):
    """Link local environment to CloudArena web platform using your Personal Arena Token."""
    run_link(token=token, event=event, handle=handle)


@app.command("whoami")
def whoami():
    """Display current competitor profile, cloud linkage status, and tournament binding."""
    run_whoami()


if __name__ == "__main__":
    app()
