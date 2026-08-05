from __future__ import annotations

from dataclasses import dataclass

from apps.core.types.mixins import DictConvertible

from .experience import IssuedDate


@dataclass(frozen=True)
class Award(DictConvertible):
    id: int
    title: str
    credential_url: str
    description: str
    issued: IssuedDate
    institution: str
    website: str
    logo: str
