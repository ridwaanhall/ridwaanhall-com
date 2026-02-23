from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime


# ---------- shared value objects for about modules ----------

@dataclass(frozen=True)
class IssuedDate:
    month: str
    year: int


@dataclass(frozen=True)
class PeriodDate:
    month: str
    year: int


@dataclass(frozen=True)
class Period:
    start: PeriodDate
    end: PeriodDate | str  # str for "Present"


@dataclass(frozen=True)
class EducationDate:
    start: PeriodDate
    end: PeriodDate


@dataclass(frozen=True)
class EducationLocation:
    regency: str
    province: str
    prov: str
    country: str
    flag: str
    map_url: str = ""


@dataclass(frozen=True)
class JourneyStep:
    timestamp: datetime | None
    title: str
    details: str
    notes: str = ""


# ---------- about_data types ----------

@dataclass(frozen=True)
class CV:
    main: str
    latest: str
    copy: str


@dataclass(frozen=True)
class PersonalInfo:
    name: str
    first_name: str
    last_name: str
    username: str  # GitHub username
    aka: str
    image_url: str
    personal_website: str
    cv: CV
    role: str
    is_active: bool
    is_open_to_work: bool
    is_hiring: bool


@dataclass(frozen=True)
class Bio:
    short_description: str
    short_bio: str
    short_cta: str
    long_description: str


@dataclass(frozen=True)
class AboutLocation:
    regency: str
    residency: str
    province: str
    prov: str
    country: str
    flag: str


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


@dataclass(frozen=True)
class DonateLink:
    platform: str
    url: str


@dataclass(frozen=True)
class AboutDataModel:
    # Identity
    personal: PersonalInfo
    bio: Bio

    # Core Content
    stories: list[str] = field(default_factory=list)
    skills: list[str] = field(default_factory=list)

    # Location & Social
    location: AboutLocation = field(default_factory=lambda: AboutLocation(
        regency="", residency="", province="", prov="", country="", flag="",
    ))
    social_media: SocialMedia = field(default_factory=lambda: SocialMedia(
        email="", github="", linkedin="", follow_linkedin="",
        instagram="", medium="", x="", website="",
    ))
    donate: list[DonateLink] = field(default_factory=list)


# ---------- awards types ----------

@dataclass(frozen=True)
class Award:
    id: int
    title: str
    credential_url: str
    description: str
    issued: IssuedDate
    institution: str
    website: str
    logo: str


# ---------- certifications types ----------

@dataclass(frozen=True)
class Certification:
    id: int
    title: str
    credential_url: str
    issued: IssuedDate
    institution: str
    website: str
    logo: str
    is_featured: bool = False
    achievements: list[str] = field(default_factory=list)


# ---------- education types ----------

@dataclass(frozen=True)
class Education:
    degree: str
    institution: str
    logo: str
    is_last: bool
    location: EducationLocation
    achievements: list[str] = field(default_factory=list)
    alias: str | None = None
    date: EducationDate | None = None
    years: str | None = None
    website: str | None = None


# ---------- experiences types ----------

@dataclass(frozen=True)
class Experience:
    id: int
    title: str
    company: str
    logo: str
    period: Period
    employment_type: str
    location_type: str
    location: str
    is_current: bool
    responsibilities: list[str] = field(default_factory=list)
    website: str = ""


# ---------- skills types ----------

@dataclass(frozen=True)
class Skill:
    name: str
    description: str
    icon_svg: str = ""


# ---------- applications types ----------

@dataclass(frozen=True)
class Application:
    id: int
    status: str
    company_name: str
    position: str
    employment_type: str
    location_type: str
    location: str
    applied_via: str | None = None
    salary_range: str | None = None
    journey: list[JourneyStep] = field(default_factory=list)
    lessons_learned: str = ""
