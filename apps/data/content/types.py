from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime


# ---------- blog types ----------

@dataclass(frozen=True)
class BlogContentItem:
    type: str
    text: str = ""
    items: list[dict[str, str]] = field(default_factory=list)
    headers: list[str] = field(default_factory=list)
    rows: list[list[str]] = field(default_factory=list)

    # styling
    class_: str = ""  # mapped from 'class' key


@dataclass(frozen=True)
class BlogData:
    # Identity
    id: int
    title: str
    description: str
    author: str
    username: str
    author_image: str

    # Media
    images: dict[str, str] = field(default_factory=dict)

    # Timestamps
    created_at: datetime | None = None
    updated_at: datetime | None = None

    # Content
    content: list[dict[str, str | list]] = field(default_factory=list)

    # Classification
    tags: list[str] = field(default_factory=list)
    category: str = ""
    slug: str = ""
    is_featured: bool = False
    read_time: int | None = None
    views: int | None = None


# ---------- project types ----------

@dataclass(frozen=True)
class Feature:
    title: str
    description: str


@dataclass(frozen=True)
class ProjectData:
    # Identity
    id: int
    title: str
    headline: str

    # Core Content
    description: list[str] = field(default_factory=list)
    features: list[Feature] = field(default_factory=list)
    images: dict[str, str] = field(default_factory=dict)

    # Tech & Resources
    tech_stack: list[dict[str, str]] = field(default_factory=list)
    github_url: str | None = None
    demo_url: str | None = None

    # Classification
    category: str = ""
    tags: list[str] = field(default_factory=list)

    # Status & Meta
    is_featured: bool = False
    featured_priority: int | None = None
    status: str = "completed"
    created_at: datetime | None = None
    updated_at: datetime | None = None
