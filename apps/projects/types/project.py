from __future__ import annotations

from enum import Enum
from typing import Any


class ProjectStatus(str, Enum):
    """
    ProjectStatus defines the standardized lifecycle states for a project.
    This Enum ensures consistency across the codebase and prevents the use
    of arbitrary string values.

    Values:
        PLANNING_REQUIREMENTS   → Project is in requirements gathering or analysis stage.
        DESIGN                  → Project is in design phase (architecture, database schema, UI/UX).
        DEVELOPMENT_IN_PROGRESS → Coding and implementation are actively ongoing.
        CODE_REVIEW             → Code has been completed and is awaiting peer/team review.
        TESTING_QA              → Project is under testing (unit, integration, or QA).
        DEPLOYMENT_RELEASED     → Project has been deployed to staging or production.
        MAINTENANCE_SUPPORT     → Project is live, receiving bug fixes, updates, or support.
        COMPLETED               → Project is fully finished with no further work required.
        ON_HOLD                 → Project is temporarily paused.
        CANCELLED               → Project has been discontinued and will not continue.
        REOPENED                → Project was previously completed or closed but has been reopened.
        UPDATE_REQUIRED         → Project requires updates due to external changes (e.g., dependencies).
    """
    PLANNING_REQUIREMENTS = "planning_requirements"
    DESIGN = "design"
    DEVELOPMENT_IN_PROGRESS = "development_in_progress"
    CODE_REVIEW = "code_review"
    TESTING_QA = "testing_qa"
    DEPLOYMENT_RELEASED = "deployment_released"
    MAINTENANCE_SUPPORT = "maintenance_support"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"
    CANCELLED = "cancelled"
    REOPENED = "reopened"
    UPDATE_REQUIRED = "update_required"


# Main lifecycle statuses first, then branch/transitional states, then terminal states.
PROJECT_STATUS_SORT_ORDER: list[ProjectStatus] = [
    ProjectStatus.PLANNING_REQUIREMENTS,
    ProjectStatus.DESIGN,
    ProjectStatus.DEVELOPMENT_IN_PROGRESS,
    ProjectStatus.CODE_REVIEW,
    ProjectStatus.TESTING_QA,
    ProjectStatus.DEPLOYMENT_RELEASED,
    ProjectStatus.MAINTENANCE_SUPPORT,
    ProjectStatus.UPDATE_REQUIRED,
    ProjectStatus.REOPENED,
    ProjectStatus.ON_HOLD,
    ProjectStatus.CANCELLED,
    ProjectStatus.COMPLETED,
]

PROJECT_STATUS_SORT_RANK: dict[str, int] = {
    status.value: index for index, status in enumerate(PROJECT_STATUS_SORT_ORDER)
}


def normalize_project_status(status: Any) -> str:
    """Normalize status value from enum/string input to a lowercase key."""
    if hasattr(status, 'value'):
        return str(status.value).lower()
    return str(status).lower()
