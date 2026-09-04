---
schemaVersion: 1
id: synthetic-commemorative-cigar
brand: synthetic-brand
line: synthetic-commemorative-line
name: Synthetic Commemorative Cigar
release:
  releaseYear: 2020
  limitedEdition: true
  commemorative: true
  editionName: Synthetic Fifth Anniversary
  anniversary: 5
  productionStatus: discontinued
  evidence:
    - sourceId: example-manufacturer-source
      field: /release
      relation: supports
      confidence: high
      claimType: manufacturer_claim
      status: supported
availability:
  status: available_secondary_market
  evidence:
    - sourceId: example-manufacturer-source
      field: /availability/status
      relation: mentions
      confidence: medium
      claimType: fact
      status: supported
declaredProfile:
  strength: 4
  body: 3
  flavorIntensity: 4
  manufacturerNotes: Synthetic manufacturer-declared profile.
  evidence:
    - sourceId: example-manufacturer-source
      field: /declaredProfile
      relation: supports
      confidence: high
      claimType: manufacturer_claim
      status: supported
variants:
  - id: synthetic-commemorative-cigar-robusto
    name: Synthetic Commemorative Robusto
    vitola:
      commercialName: Synthetic Commemorative Robusto
---

# Synthetic Commemorative Cigar

Synthetic fixture for separated release, availability, and declared-profile claims.
