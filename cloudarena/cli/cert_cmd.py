"""CLI certify command generating cryptographically verified SRE credentials."""

from pathlib import Path
from typing import Optional
import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from cloudarena.attestation.certificates import (
    generate_certificate_proof,
    get_certification_tier,
    save_certificate_file,
)
from cloudarena.core.config import load_config

console = Console()


def run_certify(output: Optional[Path] = None):
    """Generate your verifiable SRE Incident Certificate & Badge vector document."""
    config = load_config()
    player = config.player
    game = config.game

    waves_cleared = game.completed_waves or ([1] if game.current_wave > 0 else [])
    score = game.total_score or 100
    handle = player.handle or "cadet"
    event_id = player.event_id or "HACKATHON_2026"
    token = player.arena_token or "offline_dev_token"

    if not waves_cleared:
        console.print("[yellow]⚠️ You haven't cleared any attack waves yet.[/yellow]")
        console.print("Run [bold cyan]cloudarena wave start 1[/bold cyan] to earn your first certified credential!")
        return

    proof_hash = generate_certificate_proof(
        arena_token=token,
        handle=handle,
        score=score,
        waves_cleared=waves_cleared,
        event_id=event_id,
    )

    tier = get_certification_tier(len(waves_cleared))
    out_file = output or Path(f"cloudarena-certificate-{handle}.svg")

    save_certificate_file(
        output_path=out_file,
        handle=handle,
        score=score,
        waves_cleared=waves_cleared,
        event_id=event_id,
        proof_hash=proof_hash,
    )

    table = Table(show_header=False, box=None)
    table.add_column("Field", style="bold white", width=20)
    table.add_column("Value", style="cyan")

    table.add_row("Certified Cadet:", f"[bold white]@{handle}[/bold white]")
    table.add_row("Honors Title:", f"[bold green]{tier['icon']} {tier['title']}[/bold green]")
    table.add_row("Arena Standing:", f"[bold magenta]{tier['tier_name']}[/bold magenta]")
    table.add_row("Waves Conquered:", f"[bold yellow]{len(waves_cleared)} / 8 Waves[/bold yellow]")
    table.add_row("Verified Score:", f"[bold green]{score} pts[/bold green]")
    table.add_row("Tournament:", f"{event_id}")
    table.add_row("Cryptographic Proof:", f"[dim font_mono]{proof_hash}[/dim font_mono]")
    table.add_row("Exported Vector:", f"[bold cyan]{out_file.resolve()}[/bold cyan]")
    table.add_row("Online Verify URL:", "https://gdg-cloudarena.web.app")

    console.print(Panel(
        table,
        title="[bold]🎓 SRE Credential & Certificate of Mastery[/bold]",
        border_style="green",
    ))
    console.print(f"[bold green]✓ Vector certificate generated and saved to:[/bold green] {out_file}")
