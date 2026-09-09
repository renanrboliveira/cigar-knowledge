---
schemaVersion: 1
id: partial-blend-fixture
brand: partial-blend-brand
line: partial-blend-line
name: Partial Blend Fixture
blend:
  wrapper:
    - rawLabel: Documented Wrapper
      role: wrapper
      evidence:
        - sourceId: example-manufacturer-source
          field: /blend/wrapper
          relation: supports
          confidence: high
          claimType: manufacturer_claim
          status: supported
  binder: null
  filler: null
variants:
  - id: partial-blend-fixture-robusto
    name: Robusto
    vitola:
      commercialName: Robusto
---

# Partial Blend Fixture

Fixture de schema: capa documentada, capote e miolo desconhecidos. Desconhecido
é um resultado válido e não pode ser confundido com ausência de charuto.
