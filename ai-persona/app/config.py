from dataclasses import dataclass
from functools import lru_cache

from dotenv import load_dotenv
from openai import OpenAI


@dataclass(frozen=True)
class Settings:
    model: str = "gpt-4o"
    persona_name: str = "Sallu Bhai"
    user_label: str = "You"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    load_dotenv()
    return Settings()


@lru_cache(maxsize=1)
def get_client() -> OpenAI:
    load_dotenv()
    return OpenAI()