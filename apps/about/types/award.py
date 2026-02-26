from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any

from .experience import IssuedDate


@dataclass(frozen=True)
class Award:
    id: int
    title: str
    credential_url: str
    description: str
    issued: IssuedDate
    institution: str
    website: str
    logo: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
