from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

from apps.core.types.mixins import DictConvertible


@dataclass(frozen=True)
class JourneyStep(DictConvertible):
    timestamp: datetime | None
    title: str
    details: str
    notes: str = ""


@dataclass(frozen=True)
class Application(DictConvertible):
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
