from fastapi import APIRouter

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.questions import router as questions_router
from app.api.v1.endpoints.answers import router as answers_router
from app.api.v1.endpoints.users import users_router, tags_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(questions_router)
api_router.include_router(answers_router)
api_router.include_router(users_router)
api_router.include_router(tags_router)
