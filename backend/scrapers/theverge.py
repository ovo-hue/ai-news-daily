import feedparser
from .base import BaseScraper, NewsItem
from ..config import MAX_ITEMS_PER_SOURCE


class TheVergeScraper(BaseScraper):
    source_name = "The Verge"
    feed_url = "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml"

    def fetch(self):
        feed = feedparser.parse(self.feed_url)
        items = []
        for entry in feed.entries[:MAX_ITEMS_PER_SOURCE]:
            items.append(NewsItem(
                title=entry.title,
                url=entry.link,
                source=self.source_name,
                published_at=entry.get("published", ""),
                raw_content=entry.get("summary", ""),
            ))
        return items
