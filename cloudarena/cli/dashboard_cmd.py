"""Live Terminal SRE Telemetry TUI Dashboard for CloudArena."""

import time
from typing import Any, Optional
import typer
from rich.console import Console
from rich.layout import Layout
from rich.live import Live
from rich.panel import Panel
from rich.progress import BarColumn, Progress, TextColumn
from rich.table import Table
from rich.text import Text

from cloudarena.core.config import load_config
from cloudarena.k8s.client import get_core_v1, is_kubeconfig_present

dashboard_cli = typer.Typer(help="Live Terminal SRE Telemetry TUI Dashboard")
console = Console()


def build_header(handle: str, wave_num: Optional[int], event_id: str) -> Panel:
    """Build the top header panel."""
    status_text = (
        f"[bold red]🚨 WAVE {wave_num} INCIDENT ACTIVE[/bold red]"
        if wave_num
        else "[bold green]🟢 ALL SYSTEMS OPERATIONAL (CALM)[/bold green]"
    )
    grid = Table.grid(expand=True)
    grid.add_column(justify="left", ratio=1)
    grid.add_column(justify="center", ratio=2)
    grid.add_column(justify="right", ratio=1)
    grid.add_row(
        f"[bold cyan]CloudArena SRE Telemetry[/bold cyan] [dim]v0.3.0[/dim]",
        status_text,
        f"[dim]Cadet:[/dim] [bold yellow]@{handle}[/bold yellow] | [dim]{event_id}[/dim]",
    )
    return Panel(grid, border_style="cyan", padding=(0, 1))


def build_traffic_panel(traffic_pct: float) -> Panel:
    """Build the synthetic traffic success rate gauge."""
    color = "green" if traffic_pct >= 95 else "yellow" if traffic_pct > 0 else "red"
    desc = "OPTIMAL" if traffic_pct >= 95 else "DEGRADED" if traffic_pct > 0 else "OUTAGE"

    table = Table.grid(expand=True)
    table.add_column(ratio=3)
    table.add_column(justify="right", ratio=1)
    
    # Progress visual representation
    bars = int(traffic_pct / 5)
    bar_str = "█" * bars + "░" * (20 - bars)
    cell_gauge = Text.assemble((bar_str, color), "  ", (f"{traffic_pct:.1f}%", f"{color} bold"))
    cell_desc = Text.assemble((desc, f"{color} bold"), (" (SLA: >=95%)", "dim"))
    table.add_row(cell_gauge, cell_desc)
    return Panel(
        table,
        title="[bold]Synthetic Ingress Traffic Success Rate[/bold]",
        border_style=color,
        padding=(0, 1),
    )


def build_pods_table(pods: list[dict[str, Any]]) -> Table:
    """Build the microservices pod health matrix table."""
    table = Table(expand=True, box=None, header_style="bold cyan")
    table.add_column("Service Pod", ratio=2)
    table.add_column("Ready", justify="center", ratio=1)
    table.add_column("Status", justify="center", ratio=1)
    table.add_column("Restarts", justify="center", ratio=1)
    table.add_column("Health", justify="center", ratio=1)

    if not pods:
        table.add_row("[dim]No pods detected in cloudarena-app[/dim]", "-", "-", "-", "[yellow]WARN[/yellow]")
        return table

    for p in pods:
        status = p.get("status", "Unknown")
        ready = p.get("ready", "0/1")
        restarts = p.get("restarts", 0)
        name = p.get("name", "unknown")

        if status == "Running" and "1/1" in str(ready):
            status_style = "[green]Running[/green]"
            health_badge = "[green]✓ HEALTHY[/green]"
        elif "CrashLoop" in status or "Error" in status:
            status_style = "[bold red]" + status + "[/bold red]"
            health_badge = "[bold red]✖ FAILING[/bold red]"
        elif "ContainerCreating" in status or "Pending" in status:
            status_style = "[yellow]" + status + "[/yellow]"
            health_badge = "[yellow]⟳ STARTING[/yellow]"
        else:
            status_style = f"[cyan]{status}[/cyan]"
            health_badge = "[cyan]• UNKNOWN[/cyan]"

        restarts_style = f"[bold red]{restarts}[/bold red]" if restarts > 0 else "[green]0[/green]"
        table.add_row(name, str(ready), status_style, restarts_style, health_badge)

    return table


def build_event_log_panel(events: list[dict[str, str]]) -> Panel:
    """Build the real-time incident event stream panel."""
    table = Table.grid(expand=True)
    table.add_column(justify="left", ratio=1)
    table.add_column(justify="left", ratio=4)

    if not events:
        table.add_row("[dim]00:00:00[/dim]", "[dim]Waiting for incident events...[/dim]")
    else:
        for ev in events[-5:]:
            t = ev.get("time", "now")
            msg = ev.get("message", "")
            badge = ev.get("badge", "INFO")
            color = "red" if "FAIL" in badge or "CRITICAL" in badge else "green" if "OK" in badge or "RESOLVED" in badge else "yellow"
            table.add_row(f"[dim]{t}[/dim]", f"[{color}]\\[{badge}\\][/{color}] {msg}")

    return Panel(table, title="[bold]Incident Event Stream (Audit Log)[/bold]", border_style="blue", padding=(0, 1))


def build_footer() -> Panel:
    """Build the bottom keybindings / status footer."""
    text = Text.from_markup(
        "[dim]Namespace:[/dim] [cyan]cloudarena-app[/cyan]  |  "
        "[dim]Hotkeys:[/dim] [bold][Ctrl+C][/bold] Exit Dashboard  |  "
        "[bold][R][/bold] Refresh  |  "
        "[dim]Live Mode: 1s Interval[/dim]"
    )
    return Panel(text, border_style="dim", padding=(0, 1))


def get_live_cluster_data() -> tuple[list[dict[str, Any]], float, list[dict[str, str]]]:
    """Poll live Kubernetes cluster or return realistic sandbox telemetry if k8s is unavailable."""
    if not is_kubeconfig_present():
        # Simulated offline telemetry
        t = time.strftime("%H:%M:%S")
        pods = [
            {"name": "frontend-web-74b8f", "ready": "1/1", "status": "Running", "restarts": 0},
            {"name": "backend-api-6f91c", "ready": "1/1", "status": "Running", "restarts": 0},
            {"name": "cache-redis-55d8", "ready": "1/1", "status": "Running", "restarts": 0},
        ]
        return pods, 100.0, [{"time": t, "badge": "AUDIT", "message": "Cluster operational in simulation sandbox mode."}]

    try:
        core_v1 = get_core_v1()
        pod_list = core_v1.list_namespaced_pod(namespace="cloudarena-app", timeout_seconds=2)
        pods = []
        healthy_count = 0
        total_count = len(pod_list.items)

        for p in pod_list.items:
            name = p.metadata.name
            status = p.status.phase
            restarts = 0
            ready_containers = 0
            total_containers = len(p.status.container_statuses or [])
            
            if p.status.container_statuses:
                for c in p.status.container_statuses:
                    restarts += c.restart_count
                    if c.ready:
                        ready_containers += 1
                    if c.state.waiting:
                        status = c.state.waiting.reason or "Waiting"

            ready_str = f"{ready_containers}/{total_containers}" if total_containers else "0/1"
            if status == "Running" and ready_containers == total_containers:
                healthy_count += 1

            pods.append({
                "name": name,
                "ready": ready_str,
                "status": status,
                "restarts": restarts,
            })

        traffic_pct = (healthy_count / total_count * 100.0) if total_count > 0 else 0.0
        t = time.strftime("%H:%M:%S")
        events = [{"time": t, "badge": "POLL", "message": f"Cluster state checked: {healthy_count}/{total_count} pods healthy."}]
        return pods, traffic_pct, events
    except Exception as e:
        t = time.strftime("%H:%M:%S")
        return [], 0.0, [{"time": t, "badge": "WARN", "message": f"K8s API query: {str(e)[:45]}"}]


def make_dashboard_layout(
    handle: str,
    wave_num: Optional[int],
    event_id: str,
    pods: list[dict[str, Any]],
    traffic_pct: float,
    events: list[dict[str, str]],
) -> Layout:
    """Compose all Rich panels into a balanced responsive layout."""
    layout = Layout()
    layout.split_column(
        Layout(name="header", size=3),
        Layout(name="traffic", size=3),
        Layout(name="main", ratio=1),
        Layout(name="footer", size=3),
    )
    layout["main"].split_row(
        Layout(name="pods", ratio=2),
        Layout(name="events", ratio=2),
    )

    layout["header"].update(build_header(handle, wave_num, event_id))
    layout["traffic"].update(build_traffic_panel(traffic_pct))
    layout["main"]["pods"].update(Panel(build_pods_table(pods), title="[bold]Microservice Pods (cloudarena-app)[/bold]", border_style="cyan"))
    layout["main"]["events"].update(build_event_log_panel(events))
    layout["footer"].update(build_footer())
    return layout


@dashboard_cli.command("run")
def show_dashboard(
    interval: float = typer.Option(1.0, "--interval", "-i", help="Auto-refresh interval in seconds"),
    once: bool = typer.Option(False, "--once", help="Render single snapshot and exit"),
):
    """Launch the live full-screen terminal SRE telemetry TUI dashboard."""
    cfg = load_config()
    handle = cfg.player.handle or "cadet"
    wave_num = cfg.game.current_wave if cfg.game.current_wave > 0 else None
    event_id = cfg.player.event_id or "HACKATHON_2026"

    if once:
        pods, traffic, events = get_live_cluster_data()
        layout = make_dashboard_layout(handle, wave_num, event_id, pods, traffic, events)
        console.print(layout)
        return

    console.clear()
    accumulated_events: list[dict[str, str]] = [
        {"time": time.strftime("%H:%M:%S"), "badge": "INIT", "message": "Telemetry TUI initialized."}
    ]

    try:
        with Live(console=console, screen=True, auto_refresh=False) as live:
            while True:
                pods, traffic, new_events = get_live_cluster_data()
                accumulated_events.extend(new_events)
                layout = make_dashboard_layout(handle, wave_num, event_id, pods, traffic, accumulated_events[-10:])
                live.update(layout, refresh=True)
                time.sleep(interval)
    except KeyboardInterrupt:
        console.print("\n[green]Dashboard closed gracefully.[/green]")
