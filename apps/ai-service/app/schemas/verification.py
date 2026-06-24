"""
Pydantic schemas for the skill verification quiz pipeline.
"""
from __future__ import annotations

from pydantic import BaseModel, Field


class QuizGenerateRequest(BaseModel):
    skill_name: str = Field(..., description="Name of the skill to test, e.g. 'React'")
    category: str = Field(..., description="Skill category, e.g. 'Frontend Engineering'")
    num_questions: int = Field(10, ge=3, le=20)


class QuestionFull(BaseModel):
    """Server-side representation (includes correct_answer)."""
    id: str
    text: str
    options: list[str]
    correct_answer: str      # e.g. "B"
    difficulty: str = "medium"  # easy | medium | hard


class QuestionPublic(BaseModel):
    """Client-facing representation (no correct_answer)."""
    id: str
    text: str
    options: list[str]
    difficulty: str = "medium"


class QuizGenerateResponse(BaseModel):
    questions: list[QuestionPublic]
    questions_full: list[QuestionFull]   # returned to Node API only, NOT to frontend
    time_limit_minutes: int = 10
    passing_score: int = 70


class AnswerItem(BaseModel):
    question_id: str
    selected_answer: str  # "A", "B", "C", or "D"


class GradeRequest(BaseModel):
    questions: list[QuestionFull]
    answers: list[AnswerItem]


class GradeResponse(BaseModel):
    score: int              # percentage 0-100
    correct_count: int
    total_questions: int
    passed: bool
    details: list[QuestionResult]


class QuestionResult(BaseModel):
    question_id: str
    correct_answer: str
    selected_answer: str
    is_correct: bool
