from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Any


@dataclass(frozen=True)
class BlogContentItem:
    type: str
    text: str = ""
    items: list[dict[str, str]] = field(default_factory=list)
    headers: list[str] = field(default_factory=list)
    rows: list[list[str]] = field(default_factory=list)
    class_: str = ""  # mapped from 'class' key

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class BlogData:
    id: int
    title: str
    description: str
    author: str
    username: str
    author_image: str
    images: dict[str, str] = field(default_factory=dict)
    created_at: datetime | None = None
    updated_at: datetime | None = None
    content: list[dict[str, str | list]] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)
    category: str = ""
    slug: str = ""
    is_featured: bool = False
    read_time: int | None = None
    views: int | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
