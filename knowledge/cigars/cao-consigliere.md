---
schemaVersion: 1
id: cao-consigliere
brand: cao
line: cao-consigliere
name: CAO Consigliere
blend:
  wrapper:
    - rawLabel: Brazilian
      role: wrapper
      evidence:
        - sourceId: caocigars-com-cigars-consigliere
          field: /blend/wrapper
          relation: supports
          confidence: high
          claimType: manufacturer_claim
          status: confirmed
  binder:
    - rawLabel: Honduran
      role: binder
      evidence:
        - sourceId: caocigars-com-cigars-consigliere
          field: /blend/binder
          relation: supports
          confidence: high
          claimType: manufacturer_claim
          status: confirmed
  filler:
    - rawLabel: Colombian, Dominican, Nicaraguan
      role: filler
      evidence:
        - sourceId: caocigars-com-cigars-consigliere
          field: /blend/filler
          relation: supports
          confidence: high
          claimType: manufacturer_claim
          status: confirmed
release:
  productionStatus: current
  evidence:
    - sourceId: caocigars-com-cigars-consigliere
      field: /release/productionStatus
      relation: supports
      confidence: high
      claimType: manufacturer_claim
      status: confirmed
variants:
  - id: cao-consigliere-associate-robusto
    name: Associate
    vitola:
      commercialName: Robusto
      lengthMm: 127
      ringGauge: 52
  - id: cao-consigliere-boss
    name: Boss
    vitola:
      commercialName: Boss
      lengthMm: 177.8
      ringGauge: 56
  - id: cao-consigliere-tony
    name: Tony
    vitola:
      commercialName: Tony
      lengthMm: 165.1
      ringGauge: 60
  - id: cao-consigliere-soldier
    name: Soldier
    vitola:
      commercialName: Soldier
      lengthMm: 152.4
      ringGauge: 54
---

# CAO Consigliere

O blend assinatura reune capa brasileira, capote hondurenho e um miolo de tres origens (Colombia, Republica Dominicana e Nicaragua). A vitola Associate mede 5 x 52 e e comercializada com formato Robusto.
