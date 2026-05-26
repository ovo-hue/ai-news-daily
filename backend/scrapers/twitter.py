import requests
from .base import BaseScraper, NewsItem
from ..config import TWITTER_BEARER_TOKEN, MAX_ITEMS_PER_SOURCE, AI_KEYWORDS


class TwitterScraper(BaseScraper):
    source_name = "X/Twitter"
    api_url = "https://api.twitter.com/2/tweets/search/recent"

    def fetch(self):
        if not TWITTER_BEARER_TOKEN:
            print("[X/Twitter] skipped: TWITTER_BEARER_TOKEN not set")
            return []

        query = "(" + " OR ".join(AI_KEYWORDS[:6]) + ") -is:retweet lang:en"
        headers = {"Authorization": f"Bearer {TWITTER_BEARER_TOKEN}"}
        params = {
            "query": query,
            "max_results": max(10, MAX_ITEMS_PER_SOURCE),
            "tweet.fields": "created_at,public_metrics,author_id",
            "sort_order": "relevancy",
        }
        resp = requests.get(self.api_url, headers=headers, params=params, timeout=20)
        resp.raise_for_status()
        data = resp.json().get("data", [])
        items = []
        for tweet in data[:MAX_ITEMS_PER_SOURCE]:
            tid = tweet["id"]
            text = tweet["text"]
            items.append(NewsItem(
                title=text[:120] + ("…" if len(text) > 120 else ""),
                url=f"https://twitter.com/i/web/status/{tid}",
                source=self.source_name,
                published_at=tweet.get("created_at", ""),
                raw_content=text,
            ))
        return items
