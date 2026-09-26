"""CLI start command implementation for spinning up cluster and workloads."""

from typing import Optional
import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from cloudarena.core.config import load_config, save_config
from cloudarena.core.environment import audit_environment
from cloudarena.core.paths import KUBECONFIG_FILE
from cloudarena.k8s.cluster import create_cluster, is_cluster_running, list_nodes_summary
from cloudarena.k8s.deployer import deploy_base_workloads, get_workloads_summary, wait_for_workloads_ready

console = Console()


def run_start(
    event: Optional[str] = None,
    player: Optional[str] = None,
    workers: int = 2,
    skip_deploy: bool = False,
):
    """Start local cluster, deploy target workloads, and prepare Wave 1."""
    console.print(Panel.fit("[bold cyan]🚀 CloudArena Cluster Launcher[/bold cyan]"))

    config = load_config()
    if player:
        config.player.handle = player
    if event:
        config.player.event_id = event
        config.player.solo_mode = False

    # 1. Pre-flight check
    with console.status("[bold green]Validating environment prerequisites...[/bold green]"):
        env_status = audit_environment()

    if not env_status.docker_installed or not env_status.docker_running:
        console.print("[bold red]❌ Cannot start CloudArena: Docker is not active or accessible.[/bold red]")
        if env_status.docker_error:
            console.print(f"[yellow]{env_status.docker_error}[/yellow]")
        console.print("Please resolve Docker access and run [bold cyan]cloudarena start[/bold cyan] again.")
        raise typer.Exit(code=1)

    if not env_status.k3d_path:
        console.print("[bold red]❌ k3d is not installed.[/bold red]")
        console.print("Run [bold cyan]cloudarena setup -i[/bold cyan] to install it automatically.")
        raise typer.Exit(code=1)

    cluster_name = config.cluster.cluster_name

    # 2. Provision or verify k3d cluster
    if is_cluster_running(cluster_name):
        console.print(f"[green]✓ k3d cluster '{cluster_name}' is already running.[/green]")
    else:
        with console.status(f"[bold green]Provisioning 3-node cluster '{cluster_name}' (1 server, {workers} agents)...[/bold green]"):
            try:
                create_cluster(cluster_name=cluster_name, workers=workers)
                console.print(f"[bold green]✓ Cluster '{cluster_name}' created successfully![/bold green]")
            except Exception as e:
                console.print(f"[bold red]❌ Cluster provisioning failed:[/bold red] {e}")
                raise typer.Exit(code=1)

    config.cluster.is_created = True

    # 3. Deploy target workloads
    if not skip_deploy:
        with console.status("[bold green]Deploying base microservices (frontend, api, cache, traffic-gen)...[/bold green]"):
            try:
                deploy_base_workloads()
                console.print("[bold green]✓ Base manifests applied successfully.[/bold green]")
            except Exception as e:
                console.print(f"[bold red]❌ Workload deployment failed:[/bold red] {e}")
                raise typer.Exit(code=1)

        with console.status("[bold green]Waiting for all pods to become Ready and healthy...[/bold green]"):
            try:
                wait_for_workloads_ready(timeout_seconds=90)
                console.print("[bold green]✓ All workloads are healthy and operational![/bold green]")
            except Exception as e:
                console.print(f"[bold yellow]⚠️ Pod readiness warning:[/bold yellow] {e}")

    # Set initial wave if not already started
    if config.game.current_wave == 0:
        config.game.current_wave = 1
    save_config(config)

    # 4. Display Cluster Summary Table
    console.print()
    try:
        nodes = list_nodes_summary()
        node_table = Table(title="Cluster Nodes", show_lines=True)
        node_table.add_column("Node Name", style="bold white")
        node_table.add_column("Role", style="cyan")
        node_table.add_column("Status", style="bold green")
        node_table.add_column("K8s Version", style="dim")
        for n in nodes:
            node_table.add_row(n["name"], n["role"], n["status"], n["k8s_version"])
        console.print(node_table)
    except Exception:
        pass

    try:
        pods = get_workloads_summary()
        if pods:
            pod_table = Table(title="Deployed Arena Workloads", show_lines=True)
            pod_table.add_column("Namespace", style="cyan")
            pod_table.add_column("Pod Name", style="bold white")
            pod_table.add_column("Status", style="bold green")
            pod_table.add_column("Ready", style="white")
            pod_table.add_column("Restarts", style="yellow")
            pod_table.add_column("Node", style="dim")
            for p in pods:
                pod_table.add_row(p["namespace"], p["name"], p["status"], p["ready"], str(p["restarts"]), p["node"])
            console.print(pod_table)
    except Exception:
        pass

    console.print(Panel(
        f"[bold green]CloudArena is fully deployed and ready for combat![/bold green]\n\n"
        f"• Isolated Kubeconfig: [cyan]{KUBECONFIG_FILE}[/cyan]\n"
        f"• Quick inspection: [bold cyan]cloudarena kubectl get pods -A[/bold cyan]\n"
        f"• Check status: [bold cyan]cloudarena status[/bold cyan]\n"
        f"• Launch Wave 1 attack: [bold cyan]cloudarena wave start[/bold cyan]",
        title="[bold]Battlefield Ready[/bold]",
        border_style="green",
    ))
