"""
CarbonLens backend — FastAPI app.

Run locally with:
    uvicorn main:app --reload --port 8000

Endpoints:
    POST /log    -> save an activity log entry
    GET  /logs   -> list saved activity logs (demo / in-memory)
    POST /nudge  -> get a personalized AI suggestion from Claude
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import log, nudge

app = FastAPI(title="CarbonLens API", version="0.1.0")

# Allow the Vite dev server (and any frontend) to call this API.
# Tighten this list before deploying to production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(log.router)
app.include_router(nudge.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "CarbonLens API"}
