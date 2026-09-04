---
schemaVersion: 1
evidence:
  - sourceId: example-manufacturer-source
    field: /production/status
    relation: supports
    confidence: high
    claimType: manufacturer_claim
    status: supported
    rawLabel: Regular production
    note: The manufacturer describes the cigar as part of its regular portfolio.
  - sourceId: example-specialized-media-source
    field: /production/status
    relation: contradicts
    confidence: medium
    claimType: fact
    status: disputed
    rawLabel: Limited release
    note: A specialized-media report identifies the cigar as a limited release.
---

# Evidence disagreement example

Both source records are retained so the catalog can represent the unresolved
disagreement about production status.
