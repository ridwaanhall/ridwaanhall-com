from __future__ import annotations

from dataclasses import dataclass, field

from apps.core.types.mixins import DictConvertible


@dataclass(frozen=True)
class IssuedDate(DictConvertible):
    month: str
    year: int


@dataclass(frozen=True)
class PeriodDate(DictConvertible):
    month: str
    year: int


@dataclass(frozen=True)
class Period(DictConvertible):
    start: PeriodDate
    end: PeriodDate | str  # str for "Present"


@dataclass(frozen=True)
class Experience(DictConvertible):
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
