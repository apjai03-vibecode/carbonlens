"""
/nudge route — turns a user's weekly emissions totals into a single,
personalized, high-impact suggestion using the Claude API.
"""

import os

from fastapi import APIRouter, HTTPException
from dotenv import load_dotenv
import anthropic

from models import NudgeRequest, NudgeResponse

load_dotenv()

router = APIRouter(tags=["nudge"])

CLAUDE_MODEL = "claude-sonnet-4-6"

_client = None
if os.getenv("ANTHROPIC_API_KEY"):
    _client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def _build_prompt(totals: dict, top_category: str) -> str:
    return (
        "You are a friendly sustainability coach for an app called CarbonLens. "
        "A user's weekly CO2 footprint (in kg CO2e) is broken down as follows: "
        f"transport={totals['transport']:.1f}, food={totals['food']:.1f}, "
        f"energy={totals['energy']:.1f}. Their highest-impact category is "
        f"'{top_category}'. In 2-3 short sentences, give ONE specific, "
        "realistic, high-impact suggestion for this category that they could "
        "try this week. Be encouraging, concrete, and avoid generic advice "
        "like 'recycle more'. Do not use markdown formatting."
    )


@router.post("/nudge", response_model=NudgeResponse)
def get_nudge(payload: NudgeRequest):
    totals = payload.totals.model_dump()
    top_category = max(totals, key=totals.get)

    if _client is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "ANTHROPIC_API_KEY is not set on the server. "
                "Add it to backend/.env to enable AI nudges."
            ),
        )

    try:
        response = _client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=200,
            messages=[{"role": "user", "content": _build_prompt(totals, top_category)}],
        )
        message = "".join(
            block.text for block in response.content if block.type == "text"
        ).strip()
    except Exception as exc:  # pragma: no cover - surface API errors to client
        raise HTTPException(status_code=502, detail=f"Claude API error: {exc}")

    return NudgeResponse(message=message, top_category=top_category)
