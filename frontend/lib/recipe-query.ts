export const normaliseRecipeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function canonicalTitle(value: string, catalogue: string[]) {
  const needle = normaliseRecipeText(value);
  return catalogue.find((title) => normaliseRecipeText(title) === needle);
}

/**
 * Parse a recipe query without breaking multi-word titles such as Light Soup.
 * Explicit separators win. Otherwise, a longest-title-first catalogue match is
 * used and succeeds only when the whole query can be explained by known titles.
 */
export function parseRecipeQuery(value: string, catalogue: string[]): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];

  const explicit = trimmed.split(/\s*(?:\+|,|\band\b)\s*/i).filter(Boolean);
  if (explicit.length > 1) {
    return explicit.map((part) => canonicalTitle(part, catalogue) || part.trim());
  }

  const exact = canonicalTitle(trimmed, catalogue);
  if (exact) return [exact];

  const words = normaliseRecipeText(trimmed).split(" ").filter(Boolean);
  const candidates = catalogue
    .map((title) => ({ title, words: normaliseRecipeText(title).split(" ") }))
    .sort((a, b) => b.words.length - a.words.length);

  function walk(index: number): string[] | null {
    if (index === words.length) return [];
    for (const candidate of candidates) {
      const matches = candidate.words.every((word, offset) => words[index + offset] === word);
      if (!matches) continue;
      const rest = walk(index + candidate.words.length);
      if (rest) return [candidate.title, ...rest];
    }
    return null;
  }

  return walk(0) || [trimmed];
}

/** Split completed known titles from the unfinished final fragment for autocomplete. */
export function parseRecipeDraft(
  value: string,
  catalogue: string[]
): { selected: string[]; fragment: string } {
  const explicitParts = value.split(/\s*(?:\+|,|\band\b)\s*/i);
  if (explicitParts.length > 1) {
    return {
      selected: explicitParts
        .slice(0, -1)
        .map((part) => canonicalTitle(part, catalogue) || part.trim())
        .filter(Boolean),
      fragment: explicitParts.at(-1)?.trim() || "",
    };
  }

  const normalised = normaliseRecipeText(value);
  const titles = catalogue
    .map((title) => ({ title, normalised: normaliseRecipeText(title) }))
    .sort((a, b) => b.normalised.length - a.normalised.length);
  const selected: string[] = [];
  let remainder = normalised;

  while (remainder) {
    const match = titles.find((item) => remainder.startsWith(`${item.normalised} `));
    if (!match) break;
    selected.push(match.title);
    remainder = remainder.slice(match.normalised.length).trim();
  }

  return { selected, fragment: selected.length ? remainder : value.trim() };
}
