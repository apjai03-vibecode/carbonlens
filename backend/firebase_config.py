"""
Optional: Firebase Admin SDK setup for persisting logs to Firestore.

To enable:
1. In Firebase Console > Project Settings > Service Accounts,
   generate a new private key and save it as `serviceAccountKey.json`
   in this `backend/` folder (do NOT commit this file).
2. Set FIREBASE_CREDENTIALS_PATH in backend/.env if you used a
   different filename/location.
3. In routers/log.py, replace the in-memory `_LOGS` list with calls
   to `db.collection(...)` as shown in the comments there.

This module is not imported by default so the API runs without any
Firebase setup.
"""

import os

from dotenv import load_dotenv

load_dotenv()

CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", "serviceAccountKey.json")

db = None

try:
    import firebase_admin
    from firebase_admin import credentials, firestore

    if os.path.exists(CREDENTIALS_PATH):
        cred = credentials.Certificate(CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
except ImportError:
    # firebase-admin not installed — that's fine, Firestore is optional.
    pass
