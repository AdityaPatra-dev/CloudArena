"""Configuration model and persistent storage for CloudArena."""

from typing import Optional
from pydantic import BaseModel, Field
import yaml
from cloudarena.core.paths import CONFIG_FILE, ensure_directories


class PlayerConfig(BaseModel):
    handle: str = "cadet"
    email: Optional[str] = None
    user_id: Optional[str] = None
    arena_token: Optional[str] = None
    event_id: Optional[str] = None
    team_id: Optional[str] = None
    solo_mode: bool = True
    is_linked: bool = False


class ClusterConfig(BaseModel):
    cluster_name: str = "cloudarena-cluster"
    is_created: bool = False
    control_nodes: int = 1
    worker_nodes: int = 2
    app_namespace: str = "cloudarena-app"
    system_namespace: str = "cloudarena-system"


class GameState(BaseModel):
    current_wave: int = 0
    total_score: int = 0
    hints_used_in_wave: int = 0
    wave_start_time: Optional[float] = None
    completed_waves: list[int] = Field(default_factory=list)


class AppConfig(BaseModel):
    version: str = "0.1.0"
    player: PlayerConfig = Field(default_factory=PlayerConfig)
    cluster: ClusterConfig = Field(default_factory=ClusterConfig)
    game: GameState = Field(default_factory=GameState)
    central_server_url: str = "http://localhost:8000"


def load_config() -> AppConfig:
    """Load configuration from ~/.cloudarena/config.yaml or return default."""
    ensure_directories()
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f) or {}
                return AppConfig(**data)
        except Exception:
            return AppConfig()
    config = AppConfig()
    save_config(config)
    return config


def save_config(config: AppConfig) -> None:
    """Persist current configuration to ~/.cloudarena/config.yaml."""
    ensure_directories()
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        yaml.safe_dump(config.model_dump(), f, default_flow_style=False)
