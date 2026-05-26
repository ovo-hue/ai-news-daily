from dataclasses import dataclass, asdict
from typing import List


@dataclass
class NewsItem:
    title: str
    url: str
    source: str
    published_at: str
    raw_content: str = ""
    summary: str = ""
    importance: float = 0.0

    def to_dict(self):
        return asdict(self)


class BaseScraper:
    source_name = "base"

    def fetch(self) -> List[NewsItem]:
        raise NotImplementedError
