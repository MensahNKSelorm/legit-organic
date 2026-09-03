# Recipe platform — Phase 1

## What Phase 1 owns

Phase 1 provides reviewed recipes, ingredient normalisation, nutrition profiles, USDA candidate lookup, ingredient-specific weight conversions, estimated nutrition, Market matching, cart actions, and public recipe pages.

Web crawling, JSON-LD extraction, AI extraction, robots handling, SSRF controls, and import-source review belong to Phase 2. The recipe model already carries source and extraction metadata so Phase 2 will not require a domain rewrite.

## Publication workflow

Recipes begin private in `needs_review`.

1. **Normalise and prepare for review** standardises names and units and records warnings.
2. **Approve** requires servings, ingredients, quantities, and instructions.
3. Nutrition and Market product matching may be run independently. A nutrition-provider failure does not block editorial publication.
4. **Publish approved recipes** is the supported public-release action.
5. Unpublish returns a recipe to `ready`; reject keeps it private.

Only records with `is_published=True` are returned by public recipe APIs.

## AI-assisted drafting

The admin writing assistant is a drafting tool, not a recipe authority. Staff provide the
ingredients, quantities, preparation details and method in a factual brief. An attributed
source may also be recorded in the recipe provenance fields. The assistant structures those
facts into three to fifteen distinct ingredients and two to twelve instructions.

Generated methods are rejected when required quantities are missing, ingredient names repeat,
or the output falls outside the supported structure. Applying a draft only fills the unsaved
admin form and records `ai_assisted` as the extraction method. It does not approve, publish,
calculate nutrition or verify a Market match. Staff must review the form and save it explicitly.

The assistant may suggest an exact Market product only when its ingredient name matches an
available catalogue item. It never substitutes a different food. Nutrition remains entirely
outside the language model and follows the verified source priority below.

## Nutrition architecture

Nutrition is calculated by LegitOrganic. USDA FoodData Central is an upstream public-domain source, not a runtime dependency for customer pages.

Priority:

1. manually verified LegitOrganic local profile;
2. verified FAO/INFOODS WAFCT 2019 match;
3. verified USDA FoodData Central match;
4. other authoritative FAO/INFOODS analytical or biodiversity data;
5. Ghana CSIR, peer-reviewed, manufacturer or laboratory source;
6. unresolved and returned to human review.

Automatic USDA search never selects a food. Staff review candidates and confirm the correct FDC record. Confirmed mappings become reusable profiles. Local profiles require an evidence/source reference and can represent Ghanaian ingredients that USDA does not describe accurately.

The WAFCT importer follows the official Excel datasheet `05 NV_sum_57 (per 100g EP)`.
It preserves the WAFCT food code, original English and French names, scientific name,
preparation wording, BiblioID/source string, INFOODS tag, unit, raw value, parsed value,
bracket quality markers, workbook checksum, dataset version and source row. Imported source
records remain unverified and are never attached to recipe ingredients automatically.

Approximate food identities are not interchangeable. Kontomire is not silently treated as
taro leaves, gari is not treated as generic cassava, and processing states such as raw,
boiled, fermented, toasted or fried remain distinct. Aliases help staff find candidates; only
staff confirmation creates a verified reusable profile.

### WAFCT commercial-use gate

FAO permits attributed non-commercial reuse of the workbook, while commercial use requires
permission. Local validation and review imports are allowed in development. A production
import is blocked unless the WAFCT dataset is marked `granted` and contains the recorded FAO
permission reference. The workbook itself must stay outside Git.

Validate without writing:

```bash
python manage.py import_wafct /secure/path/WAFCT_2019.xlsx --validate-only
```

Import into a local development database:

```bash
python manage.py import_wafct /secure/path/WAFCT_2019.xlsx
```

After FAO permission is received, record its reference during the authorised production import:

```bash
python manage.py import_wafct /secure/path/WAFCT_2019.xlsx \
  --commercial-permission-reference="FAO permission reference"
```

All values are stored per 100 g. Recipe totals use `value × ingredient grams / 100`; per-serving values divide totals by servings. Customer-facing values are labelled estimates.

Mass units (`g`, `kg`) convert directly. Cups, spoons, pieces, bunches, tins, and similar units require a verified conversion for that specific nutrition profile. Missing conversions and quantity ranges make the calculation partial; the system does not guess.

Changes to ingredient identity, quantity, conversion, profile, or servings invalidate the nutrition fingerprint and mark results stale.

## Configuration

Set this on the backend server only:

```env
USDA_FDC_API_KEY=your_data_gov_key
```

The key must never use a `NEXT_PUBLIC_` name or enter frontend code. USDA documents a default limit of 1,000 requests per hour per IP; confirmed data is retained locally to avoid repeat searches.

## Admin operations

- Ingredient aliases preserve local, common, and scientific names.
- Nutrition profiles store values, provenance, verification, and versions.
- Measurement conversions store ingredient-specific gram weights, evidence, confidence, and verification.
- USDA candidates can be confirmed or rejected in bulk.
- WAFCT source records and regional candidates have separate review queues; imported records
  remain unverified until a staff member confirms the exact food and preparation state.
- Recipe actions normalise, approve, search USDA, calculate nutrition, match Market items, publish, unpublish, or reject.

## Customer behavior

Public recipe lists contain only reviewed, published database records—no hard-coded demo recipes. A recipe may show purchasable Market matches and add one pack per item to the existing cart. Unmatched or unavailable ingredients remain visible without being substituted.

## Verification

Run:

```bash
backend/venv/bin/python backend/manage.py check --settings=legitorganic.settings_preview
backend/venv/bin/python backend/manage.py test recipes --settings=legitorganic.settings_preview
cd frontend && npm run lint && npm run build
```

Before production deployment, run migrations, configure the USDA key, confirm admin permissions, review the first nutrition profiles and conversions, and verify publication plus cart flows against production-like data.

## Source note

USDA FoodData Central data is CC0/public domain and requests source acknowledgement. Current API and data guidance: <https://fdc.nal.usda.gov/api-guide/> and <https://fdc.nal.usda.gov/data-documentation/>.

WAFCT 2019 is published by FAO/INFOODS and lists Ghana among the represented countries. The
official workbook and reuse statement are available through
<https://www.fao.org/food-composition/tables-and-databases/detail/food-composition-tables/en>.
The Ghana CSIR/Food Research Institute 1975 table remains a secondary historical reference;
FAO describes it as a 57-page print-only publication rather than an open production dataset.
