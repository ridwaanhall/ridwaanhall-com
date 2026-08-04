from __future__ import annotations

from dataclasses import dataclass, field

from apps.core.types.mixins import DictConvertible

from .experience import PeriodDate


@dataclass(frozen=True)
class EducationDate(DictConvertible):
    start: PeriodDate
    end: PeriodDate


@dataclass(frozen=True)
class EducationLocation(DictConvertible):
    regency: str
    province: str
    prov: str
    country: str
    flag: str
    map_url: str = ""


@dataclass(frozen=True)
class Education(DictConvertible):
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
