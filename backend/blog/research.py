"""Research/grounding for the weekly auto-blog, via Tavily web search.

Gathers real, citable material for the topic BEFORE any text is generated, so
Groq writes from supplied facts rather than inventing them. Tavily is topical
(unlike keyword-matched RSS), so results are relevant by construction.

Config is read from the environment (populated by settings.load_dotenv): set
TAVILY_API_KEY to enable search. With no key, research returns nothing and the
weekly job simply skips — it never fabricates.
"""
import logging
import os

import requests

logger = logging.getLogger(__name__)

TAVILY_URL = 'https://api.tavily.com/search'

# Minimum distinct sources required to write a grounded post. Below this the
# weekly job skips rather than letting the model fill the gap.
MIN_SOURCES = 3


def fetch_web(topic, limit=10):
    """Tavily search for the topic. Returns a list of
    {title, snippet, url, source} dicts; empty when TAVILY_API_KEY is unset.
    More results = more grounded material for a fuller post (the large-context
    blog model has room for it)."""
    api_key = os.getenv('TAVILY_API_KEY', '').strip()
    if not api_key:
        logger.info('TAVILY_API_KEY not set; skipping web research.')
        return []
    try:
        resp = requests.post(
            TAVILY_URL,
            json={
                'api_key': api_key,
                'query': topic,
                'max_results': limit,
                'search_depth': 'advanced',
                'include_answer': False,
            },
            timeout=25,
        )
        resp.raise_for_status()
        results = resp.json().get('results', []) or []
    except Exception as e:
        logger.warning('Tavily search failed for %r: %s', topic, e)
        return []

    out = []
    for r in results:
        url = (r.get('url') or '').strip()
        content = (r.get('content') or '').strip()
        if not url or not content:
            continue
        out.append({
            'title': (r.get('title') or url).strip(),
            'snippet': content[:800],
            'url': url,
            'source': 'Web',
        })
    return out


def gather_research(topic):
    """Return (sources, enough) where `enough` is True once MIN_SOURCES distinct
    sources (de-duplicated by URL) are found."""
    sources = []
    seen = set()
    for item in fetch_web(topic):
        url = item['url']
        if url in seen:
            continue
        seen.add(url)
        sources.append(item)
    return sources, len(sources) >= MIN_SOURCES
