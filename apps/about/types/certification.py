from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any

from .experience import IssuedDate


@dataclass(frozen=True)
class Certification:
    id: int
    title: str
    credential_url: str
    issued: IssuedDate
    institution: str
    website: str
    logo: str
    is_featured: bool = False
    achievements: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
