import feedparser
from .base import BaseScraper, NewsItem
from ..config import MAX_ITEMS_PER_SOURCE


class TechCrunchScraper(BaseScraper):
    source_name = "TechCrunch"
    feed_url = "https://techcrunch.com/category/artificial-intelligence/feed/"

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
