"""
Verification router — quiz generation and grading endpoints.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..config import get_settings
from ..schemas.verification import (
    AnswerItem,
    GradeRequest,
    GradeResponse,
    QuestionFull,
    QuestionPublic,
    QuestionResult,
    QuizGenerateRequest,
    QuizGenerateResponse,
)
from ..services.quiz_service import get_quiz_service

router = APIRouter(prefix='/verify', tags=['verification'])


@router.post('/generate-quiz', response_model=QuizGenerateResponse)
async def generate_quiz(req: QuizGenerateRequest):
    """
    Generate a skill verification quiz using Gemini Flash.
    Returns questions WITHOUT correct answers for the frontend,
    and WITH correct answers for the Node API to store server-side.
    """
    settings = get_settings()

    if not settings.gemini_api_key:
        raise HTTPException(
            status_code=503,
            detail='GEMINI_API_KEY not configured. Quiz generation is unavailable.',
        )

    try:
        quiz_service = get_quiz_service()
        questions_full = await quiz_service.generate_quiz(
            skill_name=req.skill_name,
            category=req.category,
            num_questions=req.num_questions,
        )

        # Build public questions (strip correct_answer)
        questions_public = [
            QuestionPublic(
                id=q.id,
                text=q.text,
                options=q.options,
                difficulty=q.difficulty,
            )
            for q in questions_full
        ]

        return QuizGenerateResponse(
            questions=questions_public,
            questions_full=questions_full,
            time_limit_minutes=settings.quiz_time_limit_minutes,
            passing_score=settings.quiz_passing_score,
        )

    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post('/grade-quiz', response_model=GradeResponse)
async def grade_quiz(req: GradeRequest):
    """
    Grade submitted quiz answers against the correct answers.
    This is a pure computation — no AI call needed.
    """
    answer_map = {a.question_id: a.selected_answer for a in req.answers}
    details: list[QuestionResult] = []
    correct_count = 0

    for q in req.questions:
        selected = answer_map.get(q.id, '')
        is_correct = selected.upper() == q.correct_answer.upper()
        if is_correct:
            correct_count += 1
        details.append(QuestionResult(
            question_id=q.id,
            correct_answer=q.correct_answer,
            selected_answer=selected,
            is_correct=is_correct,
        ))

    total = len(req.questions)
    score = round((correct_count / total) * 100) if total > 0 else 0
    settings = get_settings()

    return GradeResponse(
        score=score,
        correct_count=correct_count,
        total_questions=total,
        passed=score >= settings.quiz_passing_score,
        details=details,
    )
