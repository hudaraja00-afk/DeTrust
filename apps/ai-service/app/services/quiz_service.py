"""
QuizService — generates skill verification MCQ quizzes using Gemini Flash.
"""
from __future__ import annotations

import json
import uuid
from typing import Any

from google import genai
from loguru import logger

from ..config import get_settings
from ..schemas.verification import QuestionFull


_PROMPT_TEMPLATE = """You are an expert technical interviewer. Generate exactly {num_questions} multiple-choice questions to verify proficiency in "{skill_name}" (category: {category}).

Requirements:
- Mix of conceptual (40%), practical/code (40%), and best-practices (20%) questions
- Each question must have exactly 4 options labeled A, B, C, D
- Exactly one correct answer per question
- Include a difficulty level: "easy" (3 questions), "medium" (4 questions), "hard" (3 questions)
- Questions should be unambiguous with clearly correct answers
- For coding questions, use short code snippets (under 5 lines)

Return ONLY a JSON array with this exact structure (no markdown, no explanation):
[
  {{
    "text": "What does useState return in React?",
    "options": ["A. A single state value", "B. An array with state and setter", "C. An object with state", "D. A promise"],
    "correct_answer": "B",
    "difficulty": "easy"
  }}
]
"""


class QuizService:
    """Generates skill verification quizzes via Gemini Flash."""

    def __init__(self) -> None:
        settings = get_settings()
        self._api_key = settings.gemini_api_key
        self._model = settings.gemini_model
        self._client: genai.Client | None = None

    def _get_client(self) -> genai.Client:
        if self._client is None:
            if not self._api_key:
                raise RuntimeError(
                    'GEMINI_API_KEY not set. Get one at https://aistudio.google.com/apikey'
                )
            self._client = genai.Client(api_key=self._api_key)
        return self._client

    async def generate_quiz(
        self,
        skill_name: str,
        category: str,
        num_questions: int = 10,
    ) -> list[QuestionFull]:
        """Generate MCQ questions for a skill using Gemini Flash."""
        import asyncio

        client = self._get_client()

        prompt = _PROMPT_TEMPLATE.format(
            num_questions=num_questions,
            skill_name=skill_name,
            category=category,
        )

        logger.info(f'[QuizService] Generating {num_questions} questions for "{skill_name}"')

        # Retry with exponential backoff for 503 errors (free tier overload)
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = client.models.generate_content(
                    model=self._model,
                    contents=prompt,
                    config=genai.types.GenerateContentConfig(
                        temperature=0.7,
                        max_output_tokens=4096,
                        response_mime_type='application/json',
                    ),
                )

                raw_text = response.text or ''
                questions_data = json.loads(raw_text)

                if not isinstance(questions_data, list):
                    raise ValueError('Gemini response is not a JSON array')

                questions: list[QuestionFull] = []
                for i, q in enumerate(questions_data[:num_questions]):
                    questions.append(QuestionFull(
                        id=str(uuid.uuid4())[:8],
                        text=q['text'],
                        options=q['options'],
                        correct_answer=q['correct_answer'],
                        difficulty=q.get('difficulty', 'medium'),
                    ))

                logger.info(f'[QuizService] Generated {len(questions)} questions successfully')
                return questions

            except json.JSONDecodeError as e:
                logger.error(f'[QuizService] Failed to parse Gemini response: {e}')
                raise RuntimeError('Failed to parse quiz questions from AI') from e
            except Exception as e:
                error_str = str(e)
                is_retryable = '503' in error_str or '429' in error_str
                if is_retryable and attempt < max_retries - 1:
                    wait = 2 ** (attempt + 1) + (15 if '429' in error_str else 0)
                    logger.warning(f'[QuizService] Gemini error, retrying in {wait}s (attempt {attempt + 1}/{max_retries})')
                    await asyncio.sleep(wait)
                    continue
                logger.error(f'[QuizService] Gemini API error: {e}')
                raise RuntimeError(f'Quiz generation failed: {e}') from e

        raise RuntimeError('Quiz generation failed after all retries')


# Singleton
_quiz_service: QuizService | None = None


def get_quiz_service() -> QuizService:
    global _quiz_service
    if _quiz_service is None:
        _quiz_service = QuizService()
    return _quiz_service
