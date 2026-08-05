from __future__ import annotations

from dataclasses import dataclass, field

from apps.core.types.mixins import DictConvertible

from .experience import IssuedDate


@dataclass(frozen=True)
class Certification(DictConvertible):
    id: int
    title: str
    credential_url: str
    issued: IssuedDate
    institution: str
    website: str
    logo: str
    is_featured: bool = False
    achievements: list[str] = field(default_factory=list)
