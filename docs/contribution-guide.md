# Contribution guide

This repository is a versioned knowledge base. Markdown is the human-readable
representation; YAML frontmatter is the structured representation validated by
the schemas.

## Evidence and accuracy

- Back every technical claim about a cigar, tobacco, blend, origin, processing,
  or specification with a source and field-level evidence.
- Prefer primary sources, such as manufacturers and official publications.
- Preserve the source's wording in `rawLabel` whenever a label could lose
  meaning through normalization or interpretation.
- Record unknown information as unknown or `null`; do not infer missing facts.
- Keep conflicting sources and their evidence rather than silently selecting one
  as true.
- Keep catalog facts distinct from sensory observations. Do not infer flavour
  causality without evidence.

## Repository locations

`knowledge/` contains reusable, source-backed technical and editorial material:
concepts, terroirs, brands, sensory references, and future catalog records.

`personal/` contains a person's own cellar, learning notes, comparisons, and
future smoke sessions. Personal observations remain personal and must not alter
or establish catalog facts.

`sources/` contains source documents and the bibliography. Use
`sources/manufacturers/` for manufacturer material, `sources/books/` for books,
and `sources/specialized-media/` for specialist reporting.

## Before committing

Install dependencies and run the complete test suite:

```sh
npm install
npm test
```

Validate every changed structured document against its schema before committing:

```sh
node scripts/validate.mjs <schema> <document...>
```

For example:

```sh
node scripts/validate.mjs schema/source.schema.yaml sources/manufacturers/example-manufacturer-source.md
```
