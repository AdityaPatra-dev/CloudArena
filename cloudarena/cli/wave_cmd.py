"""CLI subcommands for managing attack waves, live watch, and scoring."""

import time
from typing import Optional
import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from cloudarena.attacks.manager import (
    check_wave_resolution,
    get_attack,
    launch_wave,
    list_all_attacks,
    rollback_wave,
)
from cloudarena.core.config import load_config, save_config
from cloudarena.detection.postmortem import display_postmortem_in_console, generate_postmortem
from cloudarena.detection.state_machine import IncidentContext, IncidentState
from cloudarena.scoring.calculator import calculate_wave_score, record_wave_completion
from cloudarena.telemetry.collector import snapshot_cluster_telemetry

wave_app = typer.Typer(
    name="wave",
    help="⚔️ Manage attack waves, track telemetry, and inspect resolutions.",
    no_args_is_help=True,
)
console = Console()


@wave_app.command("start")
def start_wave(
    wave: Optional[int] = typer.Argument(None, help="Wave number to launch (1 to 8). Defaults to next uncompleted wave.")
):
    """Initiate an infrastructure attack wave."""
    config = load_config()

    if wave is None:
        wave = config.game.current_wave if config.game.current_wave > 0 else 1

    if wave < 1 or wave > 8:
        console.print("[bold red]Invalid wave number.[/bold red] Available waves: 1 to 8.")
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
        f"[dim]Check status anytime: `cloudarena wave status` | Live monitor: `cloudarena wave watch` | Need help? `cloudarena hint`[/dim]",
        title=f"[bold red]⚔️ Wave {wave} Injected[/bold red]",
        border_style="red",
    ))


@wave_app.command("status")
def status_wave():
    """Check whether the active incident has been successfully resolved and compute score."""
    config = load_config()
    current_wave = config.game.current_wave
    if current_wave == 0:
        console.print("[yellow]No wave is currently active.[/yellow] Run [bold cyan]cloudarena wave start[/bold cyan] to launch Wave 1.")
        return

    elapsed = 1
    if config.game.wave_start_time:
        elapsed = int(time.time() - config.game.wave_start_time)
    mins, secs = divmod(elapsed, 60)
    elapsed_str = f"{mins}m {secs}s"

    with console.status(f"[bold cyan]Inspecting cluster for Wave {current_wave} resolution...[/bold cyan]"):
        resolved, reason = check_wave_resolution(current_wave)

    if resolved:
        is_first_completion = current_wave not in config.game.completed_waves
        if is_first_completion:
            # Calculate and record score
            breakdown = calculate_wave_score(
                wave=current_wave,
                elapsed_seconds=elapsed,
                hints_used=config.game.hints_used_in_wave,
            )
            total_score = record_wave_completion(breakdown)

            # Generate Post-Mortem Report
            attack = get_attack(current_wave)
            ctx = IncidentContext(
                wave_number=current_wave,
                state=IncidentState.RESOLVED,
                attack_start_time=config.game.wave_start_time or (time.time() - elapsed),
                resolved_time=time.time(),
            )
            pm_path = generate_postmortem(attack.info, ctx, breakdown)

            # Print Victory & Score Summary Table
            score_table = Table(title="Wave Performance & Score Breakdown", show_lines=True)
            score_table.add_column("Category", style="bold white")
            score_table.add_column("Points", style="bold green", justify="right")
            score_table.add_row("Base Clear Points", f"+{breakdown.base_points}")
            score_table.add_row("Speed Bonus", f"+{breakdown.speed_bonus}")
            score_table.add_row("Hint Deductions", f"-{breakdown.hint_penalty}")
            score_table.add_row("Reset Deductions", f"-{breakdown.reset_penalty}")
            score_table.add_row("[bold]Net Score Earned[/bold]", f"[bold yellow]+{breakdown.net_wave_score} pts[/bold yellow]")
            score_table.add_row("[bold cyan]Total Career Score[/bold cyan]", f"[bold cyan]{total_score} pts[/bold cyan]")

            console.print(Panel(
                f"[bold green]🎉 WAVE {current_wave} CLEARED IN {elapsed_str}![/bold green]\n\n"
                f"{reason}\n\n"
                f"Incident Post-Mortem generated:\n[cyan]{pm_path}[/cyan]\n"
                f"View anytime with: [bold cyan]cloudarena postmortem {current_wave}[/bold cyan]",
                title=f"[bold green]🏆 Wave {current_wave} Victory[/bold green]",
                border_style="green",
            ))
            console.print(score_table)
            if current_wave < 4:
                console.print(f"\nReady for next challenge: [bold cyan]cloudarena wave start {current_wave + 1}[/bold cyan]")
            else:
                console.print("\n[bold gold1]🌟 CONGRATULATIONS! You have conquered all 4 CloudArena waves![/bold gold1]")
        else:
            console.print(Panel(
                f"[bold green]✓ Wave {current_wave} is already cleared.[/bold green]\n\n"
                f"{reason}\n\n"
                f"Run [bold cyan]cloudarena wave start {current_wave + 1}[/bold cyan] or inspect post-mortem via [bold cyan]cloudarena postmortem {current_wave}[/bold cyan]",
                title=f"[bold green]Wave {current_wave} Cleared[/bold green]",
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


@wave_app.command("watch")
def watch_wave():
    """Live telemetry monitor tracking pod status, traffic success rate, and incident state."""
    config = load_config()
    current_wave = config.game.current_wave
    if current_wave == 0:
        console.print("[yellow]No wave is active.[/yellow] Run [bold cyan]cloudarena wave start 1[/bold cyan] first.")
        return

    console.print(f"[bold cyan]Observing telemetry for Wave {current_wave}... (Press Ctrl+C to exit)[/bold cyan]\n")
    try:
        telemetry = snapshot_cluster_telemetry()
        resolved, reason = check_wave_resolution(current_wave)

        # Telemetry Summary Panel
        t_table = Table(title="Telemetry & Traffic Health", show_lines=True)
        t_table.add_column("Metric", style="bold white")
        t_table.add_column("Value", style="cyan")

        traffic_status = f"{telemetry.traffic.success_rate_pct}% ({telemetry.traffic.success_count}/{telemetry.traffic.total_samples})"
        t_table.add_row("Traffic Success Rate", "[green]" + traffic_status if telemetry.traffic.success_rate_pct >= 90 else "[red]" + traffic_status)
        t_table.add_row("Last HTTP Code", telemetry.traffic.last_status_code)
        t_table.add_row("Active Pods Monitored", str(len(telemetry.pods)))
        t_table.add_row("Incident Resolution", "[green]RESOLVED[/green]" if resolved else f"[yellow]{reason}[/yellow]")

        console.print(t_table)

        if telemetry.issues:
            console.print("\n[bold red]Active Degradations Detected:[/bold red]")
            for issue in telemetry.issues:
                console.print(f"  [red]• {issue}[/red]")
        else:
            console.print("\n[bold green]✓ No cluster degradations detected.[/bold green]")

    except KeyboardInterrupt:
        console.print("\n[dim]Monitor stopped.[/dim]")


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


@wave_app.command("stop")
def stop_wave(wave: Optional[int] = typer.Argument(None, help="Wave number to stop/cancel")):
    """Stop/cancel the active attack wave and restore workloads to healthy baseline."""
    rollback(wave=wave)


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
