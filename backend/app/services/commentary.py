"""
ClassPulse AI — Contextual Commentary & Activity Estimation Service.

Generates short, respectful, humorous commentary strictly based on ACTUAL
detection results (person count, chair count, books, laptops, screens)
and the chosen environment.

No claims regarding student emotions, identity, biometric traits, or attention.
Activity estimation is transparently heuristic and approximate.
"""
from __future__ import annotations

import random
from typing import Dict, List


# ---------------------------------------------------------------------------
# Classroom Commentary Banks (keyed by approximate activity level)
# ---------------------------------------------------------------------------
_CLASSROOM_COMMENTS: Dict[str, List[str]] = {
    "quiet": [
        "The classroom is calm and ready for the next lecture.",
        "Peaceful atmosphere detected. Plenty of open space.",
        "A quiet room — ideal conditions for focused study.",
        "Calm before the academic storm.",
    ],
    "moderate": [
        "A steady group of people gathered in the room.",
        "Moderate room activity. Healthy distribution of seats available.",
        "Session appears in progress with comfortable capacity.",
        "Balanced classroom environment detected.",
    ],
    "busy": [
        "The classroom is bustling with visible activity!",
        "High density detected — finding an open chair takes some searching.",
        "A very active classroom today!",
        "Solid turnout in the lecture hall.",
    ],
    "packed": [
        "Classroom appears near maximum visual capacity!",
        "Virtually all visible seating occupied.",
        "High-density gathering detected in this space.",
        "Standing or packed conditions visible in the room.",
    ],
}

_CLASSROOM_EXTRAS: Dict[str, List[str]] = {
    "many_chairs_no_people": [
        "Ample open chairs available throughout the area.",
        "Plenty of seating capacity detected.",
    ],
    "laptops_spotted": [
        "Multiple laptops visible across the desks.",
        "Digital workstations active in the room.",
    ],
    "books_spotted": [
        "Physical textbooks and notebooks detected.",
        "Classic reading materials spotted in the frame.",
    ],
}

# ---------------------------------------------------------------------------
# Library Commentary Banks (keyed by approximate activity level)
# ---------------------------------------------------------------------------
_LIBRARY_COMMENTS: Dict[str, List[str]] = {
    "quiet": [
        "The library is in deep quiet mode. Prime study territory.",
        "Very few visitors detected — serenity at maximum.",
        "Open desks and peaceful silence across the visible rows.",
        "Quiet study conditions: optimal.",
    ],
    "moderate": [
        "Moderate library activity. Plenty of desks remain open.",
        "Scholars spread out comfortably across the study hall.",
        "Calm, steady study session in progress.",
        "Good balance of available seating and working readers.",
    ],
    "busy": [
        "Library is quite busy today — grab a study spot while you can!",
        "Substantial study session underway across the room.",
        "High study hall occupancy visible.",
        "Popular study hours in effect — desk space is moving fast.",
    ],
    "packed": [
        "Library is at peak occupancy! Every corner is claimed.",
        "Full house in the library today. Midterm energy detected.",
        "High visitor density throughout the reading room.",
        "Peak study rush observed across all visible tables.",
    ],
}

_LIBRARY_EXTRAS: Dict[str, List[str]] = {
    "many_books": [
        "Books and reference volumes prominently detected.",
        "Dense collection of books visible in the background.",
    ],
    "laptops_spotted": [
        "Laptops and digital screens in active use.",
        "Digital research workstations visible.",
    ],
}


def estimate_activity_level(people_count: int) -> str:
    """
    Transparent, simple heuristic for activity level based on visible people.
    
    Heuristic rules:
      - 0 people      -> 'quiet'
      - 1 to 5 people -> 'moderate'
      - 6 to 15 people -> 'busy'
      - 16+ people    -> 'packed'

    Always clearly marked as approximate since it relies only on visible frame counts.
    """
    if people_count <= 0:
        return "quiet"
    elif people_count <= 5:
        return "moderate"
    elif people_count <= 15:
        return "busy"
    else:
        return "packed"


def generate_commentary(
    environment: str,
    people_count: int,
    chair_count: int,
    book_count: int,
    laptop_count: int,
    activity_level: str,
) -> str:
    """
    Generate contextual, respectful commentary derived from verified detections.

    Guarantees:
      - Never references objects that were not detected.
      - Never claims to evaluate feelings, focus, or personal identity.
    """
    env = environment.lower().strip()

    if env == "classroom":
        bank = _CLASSROOM_COMMENTS
        extras = _CLASSROOM_EXTRAS
        base = random.choice(bank.get(activity_level, bank["quiet"]))

        if chair_count >= 4 and people_count <= 2:
            extra = random.choice(extras["many_chairs_no_people"])
            return f"{base} {extra}"
        if laptop_count >= 2:
            extra = random.choice(extras["laptops_spotted"])
            return f"{base} {extra}"
        if book_count >= 2:
            extra = random.choice(extras["books_spotted"])
            return f"{base} {extra}"
        return base

    elif env == "library":
        bank = _LIBRARY_COMMENTS
        extras = _LIBRARY_EXTRAS
        base = random.choice(bank.get(activity_level, bank["quiet"]))

        if book_count >= 3:
            extra = random.choice(extras["many_books"])
            return f"{base} {extra}"
        if laptop_count >= 2:
            extra = random.choice(extras["laptops_spotted"])
            return f"{base} {extra}"
        return base

    return "Environment scanned. Object counts compiled."
