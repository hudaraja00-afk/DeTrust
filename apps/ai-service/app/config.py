from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        case_sensitive=False,
        extra='ignore',
        protected_namespaces=('settings_',),
    )

    # Server
    port: int = 8000
    debug: bool = False
    log_level: str = 'info'

    # Redis
    redis_url: str = 'redis://localhost:6379'
    cache_ttl_seconds: int = 3600

    # ML model paths
    model_path: str = './app/ml/trained_models'
    cold_start_model_tag: str = 'cold_start'
    performance_model_tag: str = 'performance'

    # Minimum contracts before switching to performance model
    performance_model_min_contracts: int = 2

    # Gemini (skill verification quiz generation)
    gemini_api_key: str = ''
    gemini_model: str = 'gemini-2.5-flash'
    quiz_num_questions: int = 10
    quiz_time_limit_minutes: int = 10
    quiz_passing_score: int = 70

    # API
    api_title: str = 'DeTrust AI Service'
    api_version: str = '1.0.0'


@lru_cache
def get_settings() -> Settings:
    return Settings()
