"""CLI command group for AI Incident Mentor chat and progressive guidance."""

from typing import Optional
import typer

from cloudarena.cli.hint_cmd import run_hint
from cloudarena.cli.postmortem_cmd import run_postmortem
from cloudarena.mentor.chat import run_mentor_chat

mentor_app = typer.Typer(
    name="mentor",
    help="🤖 AI Incident Mentor guidance, terminal chat, and SRE post-mortems",
    no_args_is_help=True,
)


@mentor_app.command("chat")
def mentor_chat(
    wave: Optional[int] = typer.Option(None, "--wave", "-w", help="Active wave override (1 to 8)"),
):
    """Launch an interactive streaming terminal conversation with the AI SRE Incident Mentor."""
    run_mentor_chat(wave_override=wave)


@mentor_app.command("hint")
def mentor_hint(
    yes: bool = typer.Option(False, "--yes", "-y", help="Confirm point deduction automatically without prompt"),
    force_offline: bool = typer.Option(False, "--offline", help="Use local rule catalog without attempting LLM query"),
):
    """Request progressive guidance from the AI Incident Mentor."""
    run_hint(yes=yes, force_offline=force_offline)


@mentor_app.command("postmortem")
def mentor_postmortem(
    wave: Optional[int] = typer.Argument(None, help="Wave number to inspect (1 to 8). Defaults to latest."),
):
    """View SRE Incident Post-Mortems and key architectural learnings."""
    run_postmortem(wave=wave)
