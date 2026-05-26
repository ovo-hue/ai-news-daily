import json
from datetime import datetime, timezone

from .config import OUTPUT_PATH
from .scrapers.techcrunch import TechCrunchScraper
from .scrapers.theverge import TheVergeScraper
from .scrapers.twitter import TwitterScraper
from .summarizer import summarize
from .ranker import rank


def run():
    scrapers = [TechCrunchScraper(), TheVergeScraper(), TwitterScraper()]
    all_items = []

    for s in scrapers:
        try:
            items = s.fetch()
            print(f"[{s.source_name}] fetched {len(items)} items")
            all_items.extend(items)
        except Exception as e:
            print(f"[{s.source_name}] error: {e}")

    for item in all_items:
        try:
            summarize(item)
        except Exception as e:
            print(f"summarize failed for {item.url}: {e}")
            item.summary = (item.raw_content or item.title)[:200]

    rank(all_items)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "items": [it.to_dict() for it in all_items],
    }
    OUTPUT_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"wrote {len(all_items)} items to {OUTPUT_PATH}")


if __name__ == "__main__":
    run()
