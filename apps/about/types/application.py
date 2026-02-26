from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Any


@dataclass(frozen=True)
class JourneyStep:
    timestamp: datetime | None
    title: str
    details: str
    notes: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class Application:
    id: int
    status: str
    company_name: str
    position: str
    employment_type: str
    location_type: str
    location: str
    applied_via: str | None = None
    salary_range: str | None = None
    journey: list[JourneyStep] = field(default_factory=list)
    lessons_learned: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
