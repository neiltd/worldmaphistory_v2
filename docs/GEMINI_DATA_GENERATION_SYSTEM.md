# Gemini Data Generation System
## World Intelligence Platform

---

## How It Works

```
1. Configure targets    →  src/data/config/data-generation-targets.json
2. Generate prompts     →  npm run generate:prompts
3. Copy prompt → Gemini →  paste into Gemini, save output to src/data/raw/
4. Validate             →  npm run validate:data
5. Import               →  npm run import:data
6. Use in app           →  src/data/validated/[type].json
```

**Principle**: Claude defines schemas and validates. Gemini fills sourced JSON. No data enters the app without passing validation.

---

## Step 1 — Configure Targets

**File**: `src/data/config/data-generation-targets.json`

This file controls what data gets generated for which countries and regions.

### Country target
```json
{
  "targetType": "country",
  "countryId": "USA",
  "countryName": "United States",
  "region": "North America",
  "enabledDataTypes": [
    "airports", "seaports", "powerPlants", "utilities",
    "gdpSectors", "foodSecurity", "aiAdoption", "datacenters", "railHubs"
  ]
}
```

### Region target (for cables and multi-country layers)
```json
{
  "targetType": "region",
  "regionName": "Indian Ocean",
  "region": "Indian Ocean",
  "enabledDataTypes": ["submarineCables"]
}
```

### Enabling/disabling data types

Remove a data type from `enabledDataTypes` to skip it. The generator will not produce a prompt for that combination.

Example — Singapore doesn't need railHubs or foodSecurity:
```json
{
  "countryId": "SGP",
  "enabledDataTypes": ["airports", "seaports", "utilities", "gdpSectors", "aiAdoption", "datacenters"]
}
```

### Adding a new country

Add a new object to the JSON array:
```json
{
  "targetType": "country",
  "countryId": "VNM",
  "countryName": "Vietnam",
  "region": "Southeast Asia",
  "enabledDataTypes": ["airports", "seaports", "powerPlants", "utilities", "gdpSectors", "foodSecurity", "railHubs"]
}
```

---

## Step 2 — Generate Prompts

```bash
# Generate all prompts for all targets
npm run generate:prompts

# Generate prompts for one country only
npm run generate:prompts -- --target USA
npm run generate:prompts -- --target CHN

# Generate prompts for one data type only
npm run generate:prompts -- --type airports
npm run generate:prompts -- --type submarineCables

# Generate for a specific country + data type
npm run generate:prompts -- --target USA --type airports

# Preview what would be generated (no files written)
npm run generate:prompts -- --list
```

### Output location

```
prompts/generated/
  airports/
    USA-airports.md
    CHN-airports.md
    IND-airports.md
    ...
  seaports/
    USA-seaports.md
    ...
  submarine-cables/
    Indian-Ocean-submarine-cables.md
    Pacific-Ocean-submarine-cables.md
    ...
```

---

## Step 3 — Run Prompts in Gemini

1. Open the generated prompt file, e.g. `prompts/generated/airports/USA-airports.md`
2. Copy the **entire file content**
3. Paste into Gemini (use **Gemini 2.0 Flash** or **Gemini 1.5 Pro**)
4. Gemini returns a JSON array
5. Save the JSON to the path shown at the bottom of each prompt:

```
src/data/raw/airports/USA-airports.raw.json
src/data/raw/seaports/USA-seaports.raw.json
src/data/raw/submarine-cables/Indian-Ocean-submarine-cables.raw.json
```

### Tips for better Gemini output

- Use **Gemini 2.0 Flash** for speed, **1.5 Pro** for accuracy on complex data
- If Gemini adds explanation text before/after the JSON, delete it — save only the `[...]` array
- If Gemini returns markdown code fences (` ```json `), remove them before saving
- Run validation immediately — don't batch multiple countries before checking

---

## Step 4 — Validate

```bash
# Validate all raw files
npm run validate:data

# Validate a specific type
npm run validate:data -- --type airports

# Validate a specific file
npm run validate:data -- --file src/data/raw/airports/USA-airports.raw.json
```

### What validation checks

| Check | Detail |
|---|---|
| Zod schema | Required fields, correct types, enum values |
| Coordinates | `[longitude, latitude]` order, valid range, no null island `[0,0]` |
| Country code | ISO 3166-1 alpha-3, uppercase, in known list |
| Duplicate IDs | No two records share the same ID within a file |
| Source attribution | At least 1 source with URL is required — records without sources are rejected |
| Confidence level | Warns if `confidence: "high"` but fewer than 2 sources |
| Percentage sums | Energy mix must sum to ~100%, GDP sectors must sum to ~100% |

### Fixing validation errors

| Error | Fix |
|---|---|
| `[coordinates] Coordinate [0, 0]` | Look up real coordinates on Google Maps |
| `countryId not in ISO3 list` | Correct the ISO3 code (e.g. `UK` → `GBR`) |
| `Energy mix must sum to ~100%` | Adjust the largest category so values total 100 |
| `Missing source attribution` | Add a real source URL to the record |
| `Duplicate ID` | Rename the second occurrence with a suffix |

---

## Step 5 — Import

```bash
# Import all validated raw files into src/data/validated/
npm run import:data

# Import one type only
npm run import:data -- --type airports

# Force import even with validation errors (not recommended for production)
npm run import:data -- --force
```

### What import does

1. Reads all `.raw.json` files from `src/data/raw/[type]/`
2. Normalizes records (country codes, coordinates, strings)
3. Validates each record against the Zod schema
4. Rejects records without source attribution (always, even with `--force`)
5. Deduplicates records by ID across files
6. Merges all valid records per type
7. Writes to `src/data/validated/[type].json`

### Output

```
src/data/validated/
  airports.json           ← all valid airport records merged
  seaports.json
  submarine-cables.json
  power-plants.json
  utilities.json
  gdp-sectors.json
  food-security.json
  ai-adoption.json
  datacenters.json
  rail-hubs.json
```

---

## Data Type Compatibility

| Data Type | Country Target | Region Target |
|---|---|---|
| airports | ✅ | ✗ |
| seaports | ✅ | ✅ |
| submarineCables | ✅ | ✅ |
| powerPlants | ✅ | ✗ |
| utilities | ✅ | ✗ |
| gdpSectors | ✅ | ✗ |
| foodSecurity | ✅ | ✗ |
| aiAdoption | ✅ | ✗ |
| datacenters | ✅ | ✅ |
| railHubs | ✅ | ✅ |

---

## Template Variables

Each template uses `{{variable}}` placeholders that are automatically replaced:

| Variable | Description | Example |
|---|---|---|
| `{{countryId}}` | ISO3 code | `USA` |
| `{{countryName}}` | Full country name | `United States` |
| `{{region}}` | Geographic region | `North America` |
| `{{regionName}}` | Region target name | `Indian Ocean` |
| `{{currentDate}}` | Today's date (YYYY-MM-DD) | `2024-03-15` |
| `{{limit}}` | Max records to generate | `10` |
| `{{requiredSources}}` | Minimum sources required | `2` |

---

## Adding a New Data Type

1. **Create template**: `prompts/templates/[name].template.md`
   - Use `{{variable}}` syntax for all dynamic content
   - Include: Instructions, Rules, Hallucination Prevention, Sources, Schema, Save path

2. **Add to metadata**: `prompts/templates/_metadata.json`
   ```json
   "myNewType": {
     "dataType": "myNewType",
     "templateFile": "my-new-type.template.md",
     "targetTypes": ["country"],
     "defaultLimit": 5,
     "requiredSources": 1,
     "outputSchema": "mynewtype",
     "rawFolder": "my-new-type"
   }
   ```

3. **Create Zod schema**: `src/data/schemas/mynewtype.ts`

4. **Export schema**: add to `src/data/schemas/index.ts` and `SCHEMA_MAP`

5. **Create raw folder**: `src/data/raw/my-new-type/`

6. **Add to validator**: `FOLDER_TO_SCHEMA` in `scripts/validate-data.ts`

7. **Add to importer**: `FOLDER_TO_SCHEMA` + `OUTPUT_FILENAME` in `scripts/import-data.ts`

8. **Add to generator**: `FOLDER_MAP` in `scripts/generate-gemini-prompts.ts`

9. **Create layer**: `src/layers/[group]/MyNewTypeLayer.tsx`

10. **Register in layer registry**: `src/layers/_core/registry.ts`

---

## Full Command Reference

```bash
# Generate prompts
npm run generate:prompts                          # all targets × all types
npm run generate:prompts -- --target USA          # one country
npm run generate:prompts -- --type airports       # one type
npm run generate:prompts -- --target USA --type airports
npm run generate:prompts -- --list                # preview only

# Validate
npm run validate:data                             # all raw files
npm run validate:data -- --type airports
npm run validate:data -- --file src/data/raw/airports/USA-airports.raw.json

# Import
npm run import:data                               # all types
npm run import:data -- --type airports
npm run import:data -- --force                    # skip validation (not recommended)

# Legacy single-file pipeline
npm run validate -- --type airport --file [path]
npm run pipeline -- --type airport --raw [path]
```

---

## File Naming Convention

| File | Pattern |
|---|---|
| Generated prompts | `prompts/generated/[type]/[TARGET]-[type].md` |
| Raw Gemini output | `src/data/raw/[type]/[TARGET]-[type].raw.json` |
| Validated output | `src/data/validated/[type].json` |
| Target: country | Use ISO3 code, e.g. `USA` |
| Target: region | Use slug, e.g. `Indian-Ocean` |

---

## Backend Migration

When ready to move from static JSON to a live backend:

1. Replace `src/data/validated/*.json` reads with API fetch calls
2. Run the validation pipeline server-side on ingestion
3. The Zod schemas work identically in Node.js — no changes needed
4. All layer components consume the same data shape — no component rewrites
