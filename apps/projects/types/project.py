from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Any


@dataclass(frozen=True)
class Feature:
    title: str
    description: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class ProjectData:
    id: int
    title: str
    headline: str
    description: list[str] = field(default_factory=list)
    features: list[Feature] = field(default_factory=list)
    images: dict[str, str] = field(default_factory=dict)
    tech_stack: list[dict[str, str]] = field(default_factory=list)
    github_url: str | None = None
    demo_url: str | None = None
    category: str = ""
    tags: list[str] = field(default_factory=list)
    is_featured: bool = False
    featured_priority: int | None = None
    status: str = "completed"  # completed, in-progress, planned
    created_at: datetime | None = None
    updated_at: datetime | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
