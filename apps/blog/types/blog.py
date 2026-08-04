from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

from apps.core.types.mixins import DictConvertible


@dataclass(frozen=True)
class BlogContentItem(DictConvertible):
    type: str
    text: str = ""
    items: list[dict[str, str]] = field(default_factory=list)
    headers: list[str] = field(default_factory=list)
    rows: list[list[str]] = field(default_factory=list)
    class_: str = ""  # mapped from 'class' key


@dataclass(frozen=True)
class BlogData(DictConvertible):
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
