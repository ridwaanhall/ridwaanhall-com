from __future__ import annotations

from dataclasses import dataclass

from apps.core.types.mixins import DictConvertible


@dataclass(frozen=True)
class Skill(DictConvertible):
    name: str
    description: str
    icon_svg: str = ""
    category: str | None = None
