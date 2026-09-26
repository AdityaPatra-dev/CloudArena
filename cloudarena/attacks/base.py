"""Abstract base class and metadata specification for sandboxed attack scenarios."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class AttackInfo:
    wave_number: int
    name: str
    title: str
    difficulty: str
    symptoms: str
    expected_fix: str
    description: str


class BaseAttack(ABC):
    """Abstract interface that all attack scenarios must implement."""

    @property
    @abstractmethod
    def info(self) -> AttackInfo:
        """Return metadata describing this attack scenario."""
        pass

    @abstractmethod
    def inject(self) -> bool:
        """Inject the failure condition into the Kubernetes cluster.

        Returns True if injection succeeded, False otherwise.
        """
        pass

    @abstractmethod
    def rollback(self) -> bool:
        """Revert the cluster back to a clean state before the attack.

        Returns True if rollback succeeded, False otherwise.
        """
        pass

    @abstractmethod
    def is_resolved(self) -> tuple[bool, str]:
        """Verify whether the participant has resolved the incident.

        Returns:
            (True, "Resolution message") if resolved,
            (False, "Pending reason") if still active.
        """
        pass
