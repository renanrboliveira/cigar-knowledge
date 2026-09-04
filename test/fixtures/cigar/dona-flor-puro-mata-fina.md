---
schemaVersion: 1
id: dona-flor-puro-mata-fina
brand: dona-flor
line: puro-mata-fina
name: Dona Flor Puro Mata Fina
blend:
  wrapper:
    - tobaccoId: mata-fina
      rawLabel: Mata Fina
      role: wrapper
      evidence:
        - sourceId: example-manufacturer-source
          field: /blend/wrapper
          relation: supports
          confidence: high
          claimType: manufacturer_claim
          status: supported
  binder:
    - tobaccoId: mata-fina
      rawLabel: Mata Fina
      role: binder
      evidence:
        - sourceId: example-manufacturer-source
          field: /blend/binder
          relation: supports
          confidence: high
          claimType: manufacturer_claim
          status: supported
  filler:
    - tobaccoId: mata-fina
      rawLabel: Mata Fina
      role: filler
      evidence:
        - sourceId: example-manufacturer-source
          field: /blend/filler
          relation: supports
          confidence: high
          claimType: manufacturer_claim
          status: supported
variants:
  - id: dona-flor-puro-mata-fina-robusto
    name: Robusto
    vitola:
      commercialName: Robusto
---

# Dona Flor Puro Mata Fina

Schema fixture for a documented same-identity blend across all cigar roles.
