"""
/log routes — save and retrieve activity logs.

This demo keeps logs in memory so it runs with zero setup.
Swap `_LOGS` for Firestore (see firebase_config.py) once you've
added your service account credentials.
"""

from datetime import datetime
from typing import List

from fastapi import APIRouter

from models import ActivityLog

router = APIRouter(tags=["logs"])

# In-memory store for the demo. Replace with Firestore in production:
#   from firebase_config import db
#   db.collection("users").document(uid).collection("logs").add(entry.dict())
_LOGS: List[ActivityLog] = []


@router.post("/log", response_model=ActivityLog)
def create_log(entry: ActivityLog):
    if entry.date is None:
        entry.date = datetime.utcnow()
    _LOGS.append(entry)
    return entry


@router.get("/logs", response_model=List[ActivityLog])
def list_logs():
    return _LOGS
