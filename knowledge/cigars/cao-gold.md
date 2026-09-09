---
schemaVersion: 1
id: cao-gold
brand: cao
line: cao-gold
name: CAO Gold
blend:
  wrapper:
    - rawLabel: Ecuadorian Connecticut
      role: wrapper
      evidence:
        - sourceId: caocigars-com-cigars-gold
          field: /blend/wrapper
          relation: supports
          confidence: high
          claimType: manufacturer_claim
          status: confirmed
  binder:
    - rawLabel: Nicaraguan
      role: binder
      evidence:
        - sourceId: caocigars-com-cigars-gold
          field: /blend/binder
          relation: supports
          confidence: high
          claimType: manufacturer_claim
          status: confirmed
  filler:
    - rawLabel: Nicaraguan
      role: filler
      evidence:
        - sourceId: caocigars-com-cigars-gold
          field: /blend/filler
          relation: supports
          confidence: high
          claimType: manufacturer_claim
          status: confirmed
release:
  productionStatus: current
  evidence:
    - sourceId: caocigars-com-cigars-gold
      field: /release/productionStatus
      relation: supports
      confidence: high
      claimType: manufacturer_claim
      status: confirmed
variants:
  - id: cao-gold-robusto
    name: Robusto
    vitola:
      commercialName: Robusto
      lengthMm: 127
      ringGauge: 50
---

# CAO Gold

A CAO Gold usa capa Connecticut equatoriana clara sobre capote e miolo nicaraguenses, resultando em um blend descrito pelo fabricante como "mellow-medium".
