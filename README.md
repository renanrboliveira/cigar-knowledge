# Cigar Knowledge

A versioned, Markdown-first knowledge base for cigar research, evidence, and
personal learning. Structured records use YAML frontmatter and JSON Schema
validation.

## Repository map

- `schema/` — shared and document-specific JSON Schemas used to validate YAML
  frontmatter.
- `knowledge/` — reusable, source-backed technical and editorial knowledge,
  including concepts, terroirs, brands, and sensory material.
- `knowledge/cigars/` — catálogo: marca, linha, edição, variantes e blend, com
  evidência por campo.
- `knowledge/lines/` — identidade e história de cada linha. As histórias de
  linha vieram sem procedência: a origem do catálogo não registrava fonte para
  elas, e a base não inventa uma. Nenhum documento em `knowledge/lines/` tem
  `evidence`, e isso é conhecido, não um esquecimento — a prosa de fabricante
  ali não está sustentada por fonte alguma.
- `knowledge/editorial/` — dossiê editorial por variante, com fonte obrigatória.
- `personal/` — private cellar records, learning notes, comparisons, and future
  smoke sessions; these observations do not establish catalog facts.
- `sources/` — source documents grouped by type plus the human-readable
  bibliography.
- `examples/` — small, valid examples that demonstrate the schemas and evidence
  model.

## Documentation

- [Design specification](docs/superpowers/specs/2026-09-03-cigar-knowledge-design.md)
- [Evidence model](docs/evidence-model.md)
- [Contribution guide](docs/contribution-guide.md)

## Validate changes

Install dependencies, run tests, and validate structured documents:

```sh
npm install
npm test
node scripts/validate.mjs <schema> <document...>
```

For example:

```sh
node scripts/validate.mjs schema/source.schema.yaml sources/manufacturers/example-manufacturer-source.md
```
