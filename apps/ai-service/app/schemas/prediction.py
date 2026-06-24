from typing import Literal, Optional
from pydantic import BaseModel, Field


class ColdStartInput(BaseModel):
    """Profile-only signals — no contract history required."""
    years_of_experience: float = Field(ge=0, le=60, description="Total professional years")
    hourly_rate_usd: float = Field(ge=0, le=2000, description="Current or desired hourly rate")
    rating: float = Field(ge=0, le=5, description="Platform or self-reported rating")
    client_satisfaction: float = Field(default=0.0, ge=0, le=1,
                                        description="0-1 client satisfaction score")
    primary_skill: Optional[str] = Field(default=None, description="Primary skill category")
    country: Optional[str] = Field(default=None, description="Freelancer country")


class PerformanceInput(BaseModel):
    """Contract-based signals — used when completedJobs >= 2."""
    completed_jobs: int      = Field(ge=0, description="Number of completed contracts")
    earnings_usd: float      = Field(ge=0, description="Total lifetime earnings")
    hourly_rate: float       = Field(ge=0, le=2000, description="Current hourly rate")
    success_rate: float      = Field(ge=0, le=100, description="Success rate %")
    avg_rating: float        = Field(ge=0, le=5, description="Average client rating")
    avg_job_duration_days: float = Field(default=0.0, ge=0)
    rehire_rate: float       = Field(default=0.0, ge=0, le=100)
    job_category: Optional[str]  = Field(default=None)
    project_type: Optional[str]  = Field(default=None)
    client_region: Optional[str] = Field(default=None)


class PredictionRequest(BaseModel):
    """Unified prediction request — the service selects the right model."""
    user_id: str

    # Profile signals (always present)
    years_of_experience: float = Field(ge=0, le=60)
    hourly_rate_usd: float     = Field(ge=0, le=2000)
    rating: float              = Field(default=0.0, ge=0, le=5)
    client_satisfaction: float = Field(default=0.0, ge=0, le=1)
    primary_skill: Optional[str]  = None
    country: Optional[str]        = None

    # Performance signals (optional — present only when completedJobs >= 2)
    completed_jobs: int          = Field(default=0, ge=0)
    earnings_usd: float          = Field(default=0.0, ge=0)
    success_rate: float          = Field(default=0.0, ge=0, le=100)
    avg_rating: float            = Field(default=0.0, ge=0, le=5)
    avg_job_duration_days: float = Field(default=0.0, ge=0)
    rehire_rate: float           = Field(default=0.0, ge=0, le=100)
    job_category: Optional[str]  = None
    project_type: Optional[str]  = None
    client_region: Optional[str] = None


CapabilityLevel = Literal['Beginner', 'Intermediate', 'Expert']


class PredictionResponse(BaseModel):
    user_id: str
    capability_level: CapabilityLevel
    capability_score: float = Field(description="Numeric score 0-100")
    confidence: float       = Field(description="Model confidence 0-1")
    model_used: Literal['cold_start', 'performance']
    probabilities: dict[str, float] = Field(
        description="Per-class probabilities {Beginner, Intermediate, Expert}"
    )
