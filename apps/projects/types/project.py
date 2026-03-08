from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum
from typing import Any


class ProjectStatus(str, Enum):
    PLANNING_REQUIREMENTS = "planning_requirements"
    DESIGN = "design"
    DEVELOPMENT_IN_PROGRESS = "development_in_progress"
    CODE_REVIEW = "code_review"
    TESTING_QA = "testing_qa"
    DEPLOYMENT_RELEASED = "deployment_released"
    MAINTENANCE_SUPPORT = "maintenance_support"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"
    CANCELLED = "cancelled"
    REOPENED = "reopened"
    UPDATE_REQUIRED = "update_required"


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
    status: ProjectStatus = ProjectStatus.COMPLETED
    created_at: datetime | None = None
    updated_at: datetime | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
