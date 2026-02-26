from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any

from .experience import PeriodDate


@dataclass(frozen=True)
class EducationDate:
    start: PeriodDate
    end: PeriodDate

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class EducationLocation:
    regency: str
    province: str
    prov: str
    country: str
    flag: str
    map_url: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class Education:
    degree: str
    institution: str
    logo: str
    is_last: bool
    location: EducationLocation
    achievements: list[str] = field(default_factory=list)
    alias: str | None = None
    date: EducationDate | None = None
    years: str | None = None
    website: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
