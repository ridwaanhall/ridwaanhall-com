from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any


@dataclass(frozen=True)
class IssuedDate:
    month: str
    year: int

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class PeriodDate:
    month: str
    year: int

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class Period:
    start: PeriodDate
    end: PeriodDate | str  # str for "Present"

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class Experience:
    id: int
    title: str
    company: str
    logo: str
    period: Period
    employment_type: str
    location_type: str
    location: str
    is_current: bool
    responsibilities: list[str] = field(default_factory=list)
    website: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
