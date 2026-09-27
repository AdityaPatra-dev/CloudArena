"""CLI server command to run the central leaderboard and live dashboard."""

import typer
from rich.console import Console
from rich.panel import Panel

console = Console()

server_app = typer.Typer(
    name="server",
    help="🌐 Run the central leaderboard server and organizer live dashboard.",
    no_args_is_help=True,
)


@server_app.command("start")
def start_server(
    host: str = typer.Option("127.0.0.1", "--host", "-h", help="Bind host address"),
    port: int = typer.Option(8000, "--port", "-p", help="Server port"),
):
    """Launch the FastAPI tournament leaderboard server and web dashboard."""
    try:
        import uvicorn
    except ImportError:
        console.print("[bold red]uvicorn is not installed.[/bold red] Run `pip install uvicorn` first.")
        raise typer.Exit(code=1)

    console.print(Panel(
        f"[bold green]🚀 CloudArena Tournament Server Starting[/bold green]\n\n"
        f"• Organizer Live Dashboard: [bold cyan]http://{host}:{port}/[/bold cyan]\n"
        f"• Interactive REST API Docs: [bold cyan]http://{host}:{port}/docs[/bold cyan]\n"
        f"• Leaderboard Endpoint:    [bold cyan]http://{host}:{port}/api/v1/leaderboard[/bold cyan]\n\n"
        f"[dim]Press Ctrl+C to stop the server.[/dim]",
        title="[bold]Server Broadcast[/bold]",
        border_style="green",
    ))

    uvicorn.run("cloudarena.backend.api.app:app", host=host, port=port, reload=False)

