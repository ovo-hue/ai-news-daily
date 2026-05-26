from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from .config import SOURCE_WEIGHTS, AI_KEYWORDS, HOT_KEYWORDS


def parse_date(date_str):
    if not date_str:
        return None
    try:
        return parsedate_to_datetime(date_str)
    except Exception:
        pass
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except Exception:
        return None


def score(item):
    s = SOURCE_WEIGHTS.get(item.source, 0.5)
    text = (item.title + " " + item.raw_content).lower()

    for kw in HOT_KEYWORDS:
        if kw.lower() in text:
            s += 0.15
    for kw in AI_KEYWORDS:
        if kw.lower() in text:
            s += 0.05

    dt = parse_date(item.published_at)
    if dt:
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        age_hours = (datetime.now(timezone.utc) - dt).total_seconds() / 3600
        if age_hours < 24:
            s += 0.5
        elif age_hours < 72:
            s += 0.2

    return s


def rank(items):
    for it in items:
        it.importance = round(score(it), 3)
    items.sort(key=lambda x: x.importance, reverse=True)
    return items
