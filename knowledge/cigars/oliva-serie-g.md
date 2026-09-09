---
schemaVersion: 1
id: oliva-serie-g
brand: oliva
line: oliva-serie-g
name: Oliva Serie G
evidence:
  - sourceId: olivacigar-com-cigars-serie-g
    field: /variants/0/vitola/lengthMm
    relation: supports
    confidence: high
    claimType: manufacturer_claim
    status: supported
  - sourceId: olivacigar-com-cigars-serie-g
    field: /variants/0/vitola/ringGauge
    relation: supports
    confidence: high
    claimType: manufacturer_claim
    status: supported
  - sourceId: olivacigar-com-cigars-serie-g
    field: /declaredProfile/strength
    relation: supports
    confidence: high
    claimType: manufacturer_claim
    status: supported
blend:
  wrapper:
    - rawLabel: Cameroon
      role: wrapper
      evidence:
        - sourceId: olivacigar-com-cigars-serie-g
          field: /blend/wrapper
          relation: supports
          confidence: high
          claimType: manufacturer_claim
          status: supported
  binder:
    - rawLabel: Nicaragua
      role: binder
      evidence:
        - sourceId: olivacigar-com-cigars-serie-g
          field: /blend/binder
          relation: supports
          confidence: high
          claimType: manufacturer_claim
          status: supported
  filler:
    - rawLabel: Nicaragua
      role: filler
      evidence:
        - sourceId: olivacigar-com-cigars-serie-g
          field: /blend/filler
          relation: supports
          confidence: high
          claimType: manufacturer_claim
          status: supported
release:
  productionStatus: unknown
declaredProfile:
  strength: 3
variants:
  - id: oliva-serie-g-robusto
    name: Robusto
    vitola:
      commercialName: Robusto
      lengthMm: 114
      ringGauge: 50
---

# Oliva Serie G
