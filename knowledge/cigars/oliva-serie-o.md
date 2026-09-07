---
schemaVersion: 1
id: oliva-serie-o
brand: oliva
line: oliva-serie-o
name: Oliva Serie O
evidence:
  - sourceId: olivacigar-com-cigars-serie-o
    field: /variants/0/vitola/lengthMm
    relation: supports
    confidence: high
    claimType: manufacturer_claim
    status: supported
  - sourceId: olivacigar-com-cigars-serie-o
    field: /variants/0/vitola/ringGauge
    relation: supports
    confidence: high
    claimType: manufacturer_claim
    status: supported
blend:
  wrapper:
    - rawLabel: Habano equatoriana
      role: wrapper
      evidence:
        - sourceId: olivacigar-com-cigars-serie-o
          field: /blend/wrapper
          relation: supports
          confidence: high
          claimType: manufacturer_claim
          status: supported
  binder:
    - rawLabel: Nicaragua
      role: binder
      evidence:
        - sourceId: olivacigar-com-cigars-serie-o
          field: /blend/binder
          relation: supports
          confidence: high
          claimType: manufacturer_claim
          status: supported
  filler:
    - rawLabel: Nicaragua
      role: filler
      evidence:
        - sourceId: olivacigar-com-cigars-serie-o
          field: /blend/filler
          relation: supports
          confidence: high
          claimType: manufacturer_claim
          status: supported
release:
  productionStatus: unknown
variants:
  - id: oliva-serie-o-robusto
    name: Robusto
    vitola:
      commercialName: Robusto
      lengthMm: 127
      ringGauge: 50
---

# Oliva Serie O
