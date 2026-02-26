from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any


@dataclass(frozen=True)
class CV:
    main: str
    latest: str
    copy: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class PersonalInfo:
    name: str
    first_name: str
    last_name: str
    username: str
    aka: str
    image_url: str
    personal_website: str
    cv: CV
    role: str
    is_active: bool
    is_open_to_work: bool
    is_hiring: bool

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class Bio:
    short_description: str
    short_bio: str
    short_cta: str
    long_description: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class AboutLocation:
    regency: str
    residency: str
    province: str
    prov: str
    country: str
    flag: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class SocialMedia:
    email: str
    github: str
    linkedin: str
    follow_linkedin: str
    instagram: str
    medium: str
    x: str
    website: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class DonateLink:
    platform: str
    url: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class AboutDataModel:
    personal: PersonalInfo
    bio: Bio
    stories: list[str] = field(default_factory=list)
    skills: list[str] = field(default_factory=list)
    location: AboutLocation = field(default_factory=lambda: AboutLocation(
        regency="", residency="", province="", prov="", country="", flag="",
    ))
    social_media: SocialMedia = field(default_factory=lambda: SocialMedia(
        email="", github="", linkedin="", follow_linkedin="",
        instagram="", medium="", x="", website="",
    ))
    donate: list[DonateLink] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
