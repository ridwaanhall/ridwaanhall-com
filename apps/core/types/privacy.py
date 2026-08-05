from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

from apps.core.types.mixins import DictConvertible


@dataclass(frozen=True)
class PrivacyPolicyModel(DictConvertible):
    last_updated: datetime
    overview: str
    policy_updates: str
    data_collected: dict[str, dict[str, str]] = field(default_factory=dict)
    data_usage: dict[str, str] = field(default_factory=dict)
    third_party_services: dict[str, str] = field(default_factory=dict)
    data_protection: dict[str, str] = field(default_factory=dict)
    user_rights: dict[str, str] = field(default_factory=dict)
    guestbook_limitations: dict[str, str] = field(default_factory=dict)
    email_communications: dict[str, str] = field(default_factory=dict)
    legal_basis: dict[str, str] = field(default_factory=dict)
    cookies: dict[str, dict[str, str]] = field(default_factory=dict)
    copyright_credits: dict[str, str | dict[str, str]] = field(default_factory=dict)
