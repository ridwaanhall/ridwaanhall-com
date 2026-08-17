"""
Shared vocabularies for employment and work arrangement.

Four places describe the same two things: Application and Experience each store
a single value, while OpenToWorkProfile stores a list of each and Position
stores one. They were only ever kept aligned by hand -- Experience and the
open-to-work lists were free text, so "Fulltime" or "remote" could drift in
beside "Full-time" and "Remote" and nothing would notice until a page rendered
oddly.

Defined here rather than on a model because openhire should not have to import
from about (or the reverse) just to agree on the word "Freelance".
"""

EMPLOYMENT_TYPE_CHOICES = [
    ("Full-time", "Full-time"),
    ("Part-time", "Part-time"),
    ("Self-employed", "Self-employed"),
    ("Freelance", "Freelance"),
    ("Contract", "Contract"),
    ("Internship", "Internship"),
    ("Apprenticeship", "Apprenticeship"),
    ("Seasonal", "Seasonal"),
    ("Scholarship", "Scholarship"),
]

LOCATION_TYPE_CHOICES = [
    ("On-site", "On-site"),
    ("Hybrid", "Hybrid"),
    ("Remote", "Remote"),
]

EMPLOYMENT_TYPES = [value for value, _ in EMPLOYMENT_TYPE_CHOICES]
LOCATION_TYPES = [value for value, _ in LOCATION_TYPE_CHOICES]
