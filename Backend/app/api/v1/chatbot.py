"""FastAPI Router for Ask Kolkata Intelligent Municipal Chatbot."""

import logging
from typing import Optional, Union, Dict, Any, List
from fastapi import APIRouter, Depends, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.models.admin import Admin
from app.models.team_head import TeamHead
from app.chatbot.schemas import ChatbotQueryRequest, ChatbotQueryResponse
from app.chatbot.chatbot_service import ChatbotService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chatbot", tags=["Ask Kolkata Chatbot"])


async def get_optional_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> Optional[Union[User, Admin, TeamHead]]:
    """Non-blocking optional auth extractor: allows public users while enriching context for logged-in personas."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            payload = decode_access_token(token)
            if payload and "sub" in payload:
                user_id = payload["sub"]
                u = (await db.execute(select(User).where(User.id == user_id))).scalars().first()
                if u:
                    return u
                a = (await db.execute(select(Admin).where(Admin.id == user_id))).scalars().first()
                if a:
                    return a
                t = (await db.execute(select(TeamHead).where(TeamHead.id == user_id))).scalars().first()
                if t:
                    return t
        except Exception as exc:
            logger.debug("Optional auth decode notice: %s", exc)
    return None


@router.post(
    "/query",
    response_model=ChatbotQueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Ask Kolkata NLP Query Endpoint",
    description=(
        "Deterministic, fast, local intelligence endpoint for Ask Kolkata. "
        "Answers waterlogging risks, citizen complaints, area overviews, route waterlogging corridors, and navigation."
    ),
)
async def query_chatbot(
    request: ChatbotQueryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Union[User, Admin, TeamHead]] = Depends(get_optional_current_user),
) -> ChatbotQueryResponse:
    """Execute deterministic chatbot query against municipal database and prediction telemetry."""
    return await ChatbotService.process_query(
        request=request,
        db=db,
        current_user=current_user,
    )


@router.get(
    "/status",
    summary="Chatbot Service Status",
    description="Check the operational readiness of the Ask Kolkata backend engine.",
)
async def chatbot_status() -> Dict[str, Any]:
    return {
        "service": "Ask Kolkata Engine",
        "status": "OPERATIONAL",
        "llm_dependency": "NONE (100% Local Deterministic Architecture)",
        "features": [
            "WATERLOGGING_QUERY",
            "REPORT_QUERY",
            "AREA_QUERY",
            "ROUTE_QUERY",
            "NAVIGATION",
            "HELP",
        ],
    }


@router.get(
    "/sample-prompts",
    summary="Get Curated Ask Kolkata Sample Prompts",
)
async def get_sample_prompts() -> List[Dict[str, str]]:
    return [
        {
            "category": "Risk",
            "text": "What is the waterlogging probability in Salt Lake Sector V?",
            "description": "Retrieve Random Forest probability and physical severity score",
        },
        {
            "category": "Reports",
            "text": "How many complaints are there in Sector V?",
            "description": "Inspect citizen complaints and resolved reports",
        },
        {
            "category": "Area",
            "text": "Show me the waterlogging condition in Salt Lake.",
            "description": "Synthesize area flood telemetry and center map",
        },
        {
            "category": "Route",
            "text": "I'm travelling from Dakshin Jagaddal to Sector V. What waterlogging will I face?",
            "description": "Analyze corridor waterlogging strictly along your route",
        },
        {
            "category": "Navigation",
            "text": "Take me to the complaint page.",
            "description": "Navigate straight to the citizen reporting desk",
        },
        {
            "category": "Guidance",
            "text": "How do I submit a complaint?",
            "description": "Step-by-step guidance on reporting waterlogged streets",
        },
    ]
