import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIR = ROOT / "frontend"
OUTPUT_PATH = FRONTEND_DIR / "data.json"

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

TWITTER_BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN", "")

MAX_ITEMS_PER_SOURCE = 10

SOURCE_WEIGHTS = {
    "TechCrunch": 1.0,
    "The Verge": 1.0,
    "X/Twitter": 0.9,
}

AI_KEYWORDS = [
    "GPT", "Claude", "Gemini", "LLM", "OpenAI", "Anthropic",
    "DeepMind", "agent", "diffusion", "transformer", "AGI",
    "machine learning", "neural network", "AI",
]

HOT_KEYWORDS = [
    "release", "launch", "announce", "raise", "billion",
    "breakthrough", "open source", "GPT-5", "Claude",
]
