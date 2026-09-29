"""CLI status display showing player progress and cluster health."""

from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from cloudarena.core.config import load_config
from cloudarena.core.environment import find_binary, inspect_docker

console = Console()


def run_status():
    """Display current game state, score, and cluster status."""
    config = load_config()
    _, docker_running, _ = inspect_docker()

    console.print(Panel.fit("[bold cyan]🌩️ CloudArena Tactical Overview[/bold cyan]"))

    summary_table = Table(show_header=False, box=None)
    summary_table.add_column("Property", style="bold white", width=20)
    summary_table.add_column("Value", style="cyan")

    # Player Info
    summary_table.add_row("Player Handle:", config.player.handle)
    summary_table.add_row("Mode:", "Solo Practice" if config.player.solo_mode else f"Arena Event ({config.player.event_id})")
    summary_table.add_row("Total Score:", f"[bold green]{config.game.total_score} pts[/bold green]")

    current_wave_str = f"Wave {config.game.current_wave}" if config.game.current_wave > 0 else "Not Started"
    if config.game.current_wave > 0 and config.game.current_wave not in config.game.completed_waves:
        current_wave_str += " [yellow](In Progress)[/yellow]"
    summary_table.add_row("Current Wave:", current_wave_str)
    summary_table.add_row("Completed Waves:", ", ".join(f"Wave {w}" for w in config.game.completed_waves) or "None")

    console.print(Panel(summary_table, title="[bold]Session Info[/bold]", border_style="blue"))

    # Infrastructure Info
    infra_table = Table(show_header=False, box=None)
    infra_table.add_column("Component", style="bold white", width=20)
    infra_table.add_column("Status", width=15)
    infra_table.add_column("Details", style="dim")

    infra_table.add_row("Docker Daemon", "[green]Running[/green]" if docker_running else "[red]Stopped[/red]", "")
    infra_table.add_row("k3d Engine", "[green]Ready[/green]" if find_binary("k3d") else "[yellow]Missing[/yellow]", find_binary("k3d") or "Run setup to install")
    infra_table.add_row("kubectl CLI", "[green]Ready[/green]" if find_binary("kubectl") else "[yellow]Missing[/yellow]", find_binary("kubectl") or "Run setup to install")
    infra_table.add_row("Arena Cluster", "[green]Active[/green]" if config.cluster.is_created else "[dim]Not Provisioned[/dim]", config.cluster.cluster_name)

    console.print(Panel(infra_table, title="[bold]Infrastructure State[/bold]", border_style="magenta"))

    if config.game.current_wave > 0 and config.game.current_wave not in config.game.completed_waves:
        console.print(
            f"[dim]💡 Active incident in progress: Run [bold cyan]cloudarena wave status[/bold cyan] to verify resolution & claim points.[/dim]\n"
        )
