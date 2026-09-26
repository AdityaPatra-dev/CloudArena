"""CLI command for running pre-flight audits and auto-installing tools."""

import typer
from rich.console import Console
from rich.panel import Panel
from rich.progress import BarColumn, DownloadColumn, Progress, TextColumn, TimeRemainingColumn, TransferSpeedColumn
from rich.table import Table

from cloudarena.core.environment import audit_environment
from cloudarena.core.installer import install_k3d, install_kubectl
from cloudarena.core.paths import BIN_DIR

console = Console()


def run_setup(install_tools: bool = typer.Option(False, "--install-tools", "-i", help="Auto-install missing k3d & kubectl binaries to ~/.cloudarena/bin")):
    """Run system prerequisite checks and prepare the local environment."""
    console.print(Panel.fit("[bold cyan]🌩️ CloudArena Environment Pre-Flight Inspector[/bold cyan]"))
    
    with console.status("[bold green]Auditing system resources and dependencies...[/bold green]"):
        status = audit_environment()

    table = Table(title="System & Tooling Audit", show_lines=True)
    table.add_column("Component", style="bold white", width=22)
    table.add_column("Status", width=12)
    table.add_column("Details", style="dim")

    for check in status.checks:
        status_str = "[bold green]PASS[/bold green]" if check.passed else "[bold red]FAIL[/bold red]"
        table.add_row(check.name, status_str, check.details)

    console.print(table)

    # Check for missing tools and offer install
    missing_k3d = status.k3d_path is None
    missing_kubectl = status.kubectl_path is None

    if missing_k3d or missing_kubectl:
        if not install_tools:
            console.print("\n[yellow]⚠️ Missing local Kubernetes tools detected.[/yellow]")
            console.print(f"You can install them automatically into [bold]{BIN_DIR}[/bold] without root/sudo.")
            import sys
            if sys.stdin.isatty():
                should_install = typer.confirm("Would you like CloudArena to download and install them now?", default=True)
                if should_install:
                    install_tools = True
            else:
                console.print("[dim]Run [bold]cloudarena setup -i[/bold] to automatically download and install missing tools.[/dim]")

        if install_tools:
            with Progress(
                TextColumn("[bold blue]{task.description}"),
                BarColumn(),
                DownloadColumn(),
                TransferSpeedColumn(),
                TimeRemainingColumn(),
            ) as progress:
                if missing_k3d:
                    k3d_task = progress.add_task("Downloading k3d...", total=None)
                    def update_k3d(d, t):
                        progress.update(k3d_task, completed=d, total=t)
                    install_k3d(update_k3d)
                    console.print("[green]✓ k3d successfully installed to ~/.cloudarena/bin/k3d[/green]")

                if missing_kubectl:
                    kubectl_task = progress.add_task("Downloading kubectl...", total=None)
                    def update_kubectl(d, t):
                        progress.update(kubectl_task, completed=d, total=t)
                    install_kubectl(update_kubectl)
                    console.print("[green]✓ kubectl successfully installed to ~/.cloudarena/bin/kubectl[/green]")

    # Check for failed checks with remediation
    failed_checks = [c for c in status.checks if not c.passed and c.remediation]
    if failed_checks:
        console.print("\n[bold red]Action Required for Failed Checks:[/bold red]")
        for c in failed_checks:
            console.print(f"\n[bold yellow]• {c.name}:[/bold yellow]")
            console.print(f"  {c.remediation}")
    elif status.all_passed:
        console.print("\n[bold green]🎉 All system checks passed! CloudArena is ready to start.[/bold green]")
        console.print("Run [bold cyan]cloudarena start[/bold cyan] to spin up your local arena cluster.")
