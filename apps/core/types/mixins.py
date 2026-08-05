from __future__ import annotations

from dataclasses import asdict
from typing import Any


class DictConvertible:
    """Mixin for frozen dataclasses that need a dict representation."""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
