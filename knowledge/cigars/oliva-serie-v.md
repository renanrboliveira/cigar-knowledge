---
schemaVersion: 1
id: oliva-serie-v
brand: oliva
line: oliva-serie-v
name: Oliva Serie V
evidence:
  - sourceId: olivacigar-com-cigars-serie-v
    field: /variants/0/vitola/lengthMm
    relation: supports
    confidence: high
    claimType: manufacturer_claim
    status: supported
  - sourceId: olivacigar-com-cigars-serie-v
    field: /variants/0/vitola/ringGauge
    relation: supports
    confidence: high
    claimType: manufacturer_claim
    status: supported
blend:
  wrapper:
    - rawLabel: Habano Sun Grown equatoriana
      role: wrapper
      evidence:
        - sourceId: olivacigar-com-cigars-serie-v
          field: /blend/wrapper
          relation: supports
          confidence: high
          claimType: manufacturer_claim
          status: supported
  binder:
    - rawLabel: Nicaragua
      role: binder
      evidence:
        - sourceId: olivacigar-com-cigars-serie-v
          field: /blend/binder
          relation: supports
          confidence: high
          claimType: manufacturer_claim
          status: supported
  filler:
    - rawLabel: Nicaragua
      role: filler
      evidence:
        - sourceId: olivacigar-com-cigars-serie-v
          field: /blend/filler
          relation: supports
          confidence: high
          claimType: manufacturer_claim
          status: supported
release:
  productionStatus: unknown
variants:
  - id: oliva-serie-v-torpedo
    name: Torpedo
    vitola:
      commercialName: Torpedo
      lengthMm: 152
      ringGauge: 56
---

# Oliva Serie V
