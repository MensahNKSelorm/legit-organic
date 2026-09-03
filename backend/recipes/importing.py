"""Review-first recipe research and approved-source extraction."""

import hashlib
import ipaddress
import json
import os
import re
import socket
from difflib import SequenceMatcher
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import requests
import urllib3
from django.utils import timezone

from .models import Recipe, RecipeSource


USER_AGENT = 'LegitOrganicRecipeReviewer/1.0 (+https://legitorganic.com/contact)'
MAX_PAGE_BYTES = 1_000_000
MAX_REDIRECTS = 3


class RecipeImportError(ValueError):
    code = 'import_failed'

    def __init__(self, message, code=None):
        super().__init__(message)
        if code:
            self.code = code


class _RecipePageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.json_ld = []
        self.title = ''
        self._capture_json = False
        self._capture_title = False
        self._parts = []
        self._text_parts = []
        self._suppressed = 0

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == 'script' and values.get('type', '').lower() == 'application/ld+json':
            self._capture_json = True
            self._parts = []
        elif tag == 'title':
            self._capture_title = True
            self._parts = []
        if tag in {'script', 'style', 'noscript', 'svg'}:
            self._suppressed += 1

    def handle_endtag(self, tag):
        if tag == 'script' and self._capture_json:
            self.json_ld.append(''.join(self._parts))
            self._capture_json = False
            self._parts = []
        elif tag == 'title' and self._capture_title:
            self.title = ' '.join(''.join(self._parts).split())[:300]
            self._capture_title = False
            self._parts = []
        if tag in {'script', 'style', 'noscript', 'svg'}:
            self._suppressed = max(0, self._suppressed - 1)

    def handle_data(self, data):
        if self._capture_json or self._capture_title:
            self._parts.append(data)
        if not self._suppressed and not self._capture_json:
            cleaned = ' '.join(data.split())
            if cleaned:
                self._text_parts.append(cleaned)

    @property
    def visible_text(self):
        return '\n'.join(self._text_parts)[:40_000]


def _public_addresses(hostname):
    try:
        records = socket.getaddrinfo(hostname, None, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise RecipeImportError('The source host could not be resolved.', 'host_unavailable') from exc
    addresses = {record[4][0] for record in records}
    if not addresses:
        raise RecipeImportError('The source host could not be resolved.', 'host_unavailable')
    for address in addresses:
        ip = ipaddress.ip_address(address)
        if not ip.is_global:
            raise RecipeImportError('Private or local network addresses are not allowed.', 'unsafe_url')
    return addresses


def validate_public_url(url):
    parsed = urlparse(str(url or '').strip())
    if parsed.scheme not in {'http', 'https'} or not parsed.hostname or parsed.username:
        raise RecipeImportError('Enter a public HTTP or HTTPS recipe URL.', 'invalid_url')
    if parsed.port not in {None, 80, 443}:
        raise RecipeImportError('Only standard web ports are allowed.', 'unsafe_url')
    _public_addresses(parsed.hostname)
    return parsed.geturl()


def source_for_url(url):
    hostname = (urlparse(url).hostname or '').lower().rstrip('.')
    matches = []
    for source in RecipeSource.objects.filter(enabled=True):
        approved = (urlparse(source.base_url).hostname or '').lower().rstrip('.')
        if hostname == approved or hostname.endswith(f'.{approved}'):
            matches.append((len(approved), source))
    if matches:
        return max(matches, key=lambda item: item[0])[1]
    raise RecipeImportError(
        'This website has not been approved as a recipe source. Add and review it under Recipe sources first.',
        'source_not_approved',
    )


def _fetch(url, allow_not_found=False):
    current = validate_public_url(url)
    headers = {'User-Agent': USER_AGENT, 'Accept': 'text/html,application/xhtml+xml'}
    for _ in range(MAX_REDIRECTS + 1):
        parsed = urlparse(current)
        addresses = sorted(_public_addresses(parsed.hostname))
        path = parsed.path or '/'
        if parsed.query:
            path = f'{path}?{parsed.query}'
        request_headers = {**headers, 'Host': parsed.netloc}
        response = None
        last_error = None
        for address in addresses:
            try:
                timeout = urllib3.Timeout(connect=5, read=15)
                if parsed.scheme == 'https':
                    pool = urllib3.HTTPSConnectionPool(
                        address,
                        port=parsed.port or 443,
                        server_hostname=parsed.hostname,
                        assert_hostname=parsed.hostname,
                        cert_reqs='CERT_REQUIRED',
                        ca_certs=requests.certs.where(),
                        timeout=timeout,
                        maxsize=1,
                    )
                else:
                    pool = urllib3.HTTPConnectionPool(
                        address, port=parsed.port or 80, timeout=timeout, maxsize=1
                    )
                response = pool.request(
                    'GET', path, headers=request_headers, preload_content=False, redirect=False
                )
                break
            except urllib3.exceptions.HTTPError as exc:
                last_error = exc
        if response is None:
            raise RecipeImportError('The approved source could not be reached.', 'source_unavailable') from last_error
        try:
            if response.status in {301, 302, 303, 307, 308}:
                location = response.headers.get('Location')
                if not location:
                    raise RecipeImportError('The source returned an invalid redirect.', 'invalid_redirect')
                current = validate_public_url(urljoin(current, location))
                continue
            if response.status == 404 and allow_not_found:
                return current, b'', 'utf-8'
            if response.status >= 400:
                raise RecipeImportError(
                    f'The source returned HTTP {response.status}.', 'source_http_error'
                )
            content_type = response.headers.get('Content-Type', '').lower()
            if 'html' not in content_type and 'text/plain' not in content_type:
                raise RecipeImportError('The source did not return a recipe webpage.', 'unsupported_content')
            body = bytearray()
            for chunk in response.stream(16_384):
                body.extend(chunk)
                if len(body) > MAX_PAGE_BYTES:
                    raise RecipeImportError('The source page is too large to review safely.', 'page_too_large')
            encoding_match = re.search(r'charset=([\w-]+)', content_type)
            return current, bytes(body), encoding_match.group(1) if encoding_match else 'utf-8'
        finally:
            response.release_conn()
    raise RecipeImportError('The source redirected too many times.', 'too_many_redirects')


def _check_robots(url, source):
    parsed = urlparse(url)
    robots_url = f'{parsed.scheme}://{parsed.netloc}/robots.txt'
    try:
        _, body, encoding = _fetch(robots_url, allow_not_found=True)
    except (RecipeImportError, requests.RequestException):
        raise RecipeImportError(
            'The source robots policy could not be confirmed. Review the source before retrying.',
            'robots_unavailable',
        )
    if not body:
        source.robots_checked_at = timezone.now()
        source.save(update_fields=['robots_checked_at', 'updated_at'])
        return
    parser = RobotFileParser()
    parser.set_url(robots_url)
    parser.parse(body.decode(encoding, errors='replace').splitlines())
    source.robots_checked_at = timezone.now()
    source.save(update_fields=['robots_checked_at', 'updated_at'])
    if not parser.can_fetch(USER_AGENT, url):
        raise RecipeImportError('This source does not permit recipe retrieval.', 'robots_blocked')


def fetch_approved_recipe(url):
    safe_url = validate_public_url(url)
    source = source_for_url(safe_url)
    if not source.allows_recipe_reuse or not source.reuse_reviewed_at:
        raise RecipeImportError(
            'This source is not approved for recipe reuse. Update its reviewed permissions first.',
            'reuse_not_approved',
        )
    _check_robots(safe_url, source)
    final_url, body, encoding = _fetch(safe_url)
    if source_for_url(final_url).pk != source.pk:
        raise RecipeImportError('The source redirected outside its approved domain.', 'redirect_not_approved')
    html = body.decode(encoding, errors='replace')
    return {
        'source': source,
        'url': final_url,
        'html': html,
        'content_hash': hashlib.sha256(body).hexdigest(),
    }


def _walk_json_ld(value):
    if isinstance(value, list):
        for item in value:
            yield from _walk_json_ld(item)
    elif isinstance(value, dict):
        types = value.get('@type', [])
        if isinstance(types, str):
            types = [types]
        if any(str(item).lower() == 'recipe' for item in types):
            yield value
        if '@graph' in value:
            yield from _walk_json_ld(value['@graph'])


def _duration_minutes(value):
    match = re.fullmatch(r'P(?:\d+D)?T(?:(\d+)H)?(?:(\d+)M)?', str(value or '').upper())
    if not match:
        return None
    return int(match.group(1) or 0) * 60 + int(match.group(2) or 0)


def _yield_servings(value):
    match = re.search(r'\d+', str(value or ''))
    return int(match.group()) if match else None


def _instructions(value, section=''):
    output = []
    if isinstance(value, str):
        if value.strip():
            output.append({'instruction': ' '.join(value.split()), 'section': section})
    elif isinstance(value, list):
        for item in value:
            output.extend(_instructions(item, section))
    elif isinstance(value, dict):
        kind = str(value.get('@type', '')).lower()
        if kind == 'howtosection':
            output.extend(_instructions(value.get('itemListElement', []), str(value.get('name', ''))))
        else:
            output.extend(_instructions(value.get('text') or value.get('name') or '', section))
    return output


def extract_recipe_json_ld(html):
    parser = _RecipePageParser()
    parser.feed(html)
    for block in parser.json_ld:
        try:
            data = json.loads(block)
        except (TypeError, json.JSONDecodeError):
            continue
        for recipe in _walk_json_ld(data):
            author = recipe.get('author', '')
            if isinstance(author, dict):
                author = author.get('name', '')
            elif isinstance(author, list):
                author = ', '.join(
                    str(item.get('name', '')) if isinstance(item, dict) else str(item)
                    for item in author
                )
            raw_ingredients = recipe.get('recipeIngredient', [])
            if isinstance(raw_ingredients, str):
                raw_ingredients = [raw_ingredients]
            ingredients = [
                {'raw_text': ' '.join(str(item).split())}
                for item in raw_ingredients
                if str(item).strip()
            ]
            instructions = _instructions(recipe.get('recipeInstructions', []))
            if ingredients and instructions:
                return {
                    'title': ' '.join(str(recipe.get('name', '')).split())[:300],
                    'description': ' '.join(str(recipe.get('description', '')).split())[:1000],
                    'author': ' '.join(str(author).split())[:200],
                    'country': '',
                    'region': '',
                    'cuisine': ' '.join(str(recipe.get('recipeCuisine', '')).split())[:100],
                    'recipe_category': ' '.join(str(recipe.get('recipeCategory', '')).split())[:100],
                    'meal_type': '',
                    'keywords': recipe.get('keywords', []),
                    'servings': _yield_servings(recipe.get('recipeYield')),
                    'prep_time': _duration_minutes(recipe.get('prepTime')),
                    'cook_time': _duration_minutes(recipe.get('cookTime')),
                    'ingredients': ingredients,
                    'steps': instructions,
                }
    return None


def extract_page_text(html):
    parser = _RecipePageParser()
    parser.feed(html)
    return parser.visible_text


def research_recipe(idea, country='Ghana', region=''):
    api_key = os.getenv('TAVILY_API_KEY', '').strip()
    if not api_key:
        raise RecipeImportError('Web research is not configured.', 'research_not_configured')
    query = ' '.join(part for part in [country, region, idea, 'recipe ingredients method'] if part)
    response = requests.post(
        'https://api.tavily.com/search',
        json={
            'api_key': api_key,
            'query': query,
            'search_depth': 'advanced',
            'max_results': 6,
            'include_answer': False,
            'include_raw_content': False,
        },
        timeout=25,
    )
    response.raise_for_status()
    sources = []
    for item in response.json().get('results', []):
        url = str(item.get('url') or '').strip()
        if urlparse(url).scheme not in {'http', 'https'}:
            continue
        sources.append(
            {
                'title': ' '.join(str(item.get('title') or '').split())[:200],
                'url': url[:1000],
                'snippet': ' '.join(str(item.get('content') or '').split())[:1500],
            }
        )
    if len(sources) < 2:
        raise RecipeImportError('Not enough reliable material was found for a grounded draft.', 'thin_research')
    return sources


def find_duplicate(title, source_url='', content_hash=''):
    if source_url:
        match = Recipe.objects.filter(source_url=source_url).first()
        if match:
            return match
    if content_hash:
        match = Recipe.objects.filter(source_content_hash=content_hash).first()
        if match:
            return match
    clean_title = ' '.join(str(title or '').split())
    if not clean_title:
        return None
    exact = Recipe.objects.filter(title__iexact=clean_title).first()
    if exact:
        return exact
    normalized = re.sub(r'[^a-z0-9]+', ' ', clean_title.casefold()).strip()
    for recipe in Recipe.objects.only('id', 'title').order_by('-updated_at')[:300]:
        candidate = re.sub(r'[^a-z0-9]+', ' ', recipe.title.casefold()).strip()
        if SequenceMatcher(None, normalized, candidate).ratio() >= 0.88:
            return recipe
    return None
