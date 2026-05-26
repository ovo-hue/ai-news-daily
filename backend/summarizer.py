import requests
from .config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL


def _clean(text: str) -> str:
    import re
    return re.sub(r"<[^>]*>", "", text or "").strip()


def summarize(item):
    raw = _clean(item.raw_content) or item.title
    if not DEEPSEEK_API_KEY:
        item.summary = raw[:200]
        return item

    prompt = (
        "请将下面这条 AI 相关英文新闻，翻译并精炼成 2-3 句中文摘要，"
        "突出关键信息（公司、产品、数字、影响）。"
        "只输出中文摘要本身，不要任何前缀、标题或解释。\n\n"
        f"标题: {item.title}\n"
        f"来源: {item.source}\n"
        f"原文: {raw[:1800]}"
    )

    resp = requests.post(
        f"{DEEPSEEK_BASE_URL}/chat/completions",
        headers={
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": DEEPSEEK_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 400,
            "temperature": 0.3,
            "stream": False,
        },
        timeout=60,
    )
    resp.raise_for_status()
    data = resp.json()
    item.summary = data["choices"][0]["message"]["content"].strip()
    return item
