from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any


@dataclass(frozen=True)
class Skill:
    name: str
    description: str
    icon_svg: str = ""
    category: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
