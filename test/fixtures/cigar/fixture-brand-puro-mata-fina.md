---
schemaVersion: 1
id: fixture-brand-puro-mata-fina
brand: fixture-brand
line: puro-mata-fina
name: Fixture Brand Puro Mata Fina
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
  - id: synthetic-validation-vitola
    name: Synthetic Validation Vitola
    vitola:
      commercialName: Synthetic Validation Vitola
---

# Fixture Brand Puro Mata Fina

Schema fixture for a documented same-identity blend across all cigar roles.
A marca e sintetica de proposito: a fixture nao tem fonte para o blend que
declara, e atribui-lo a uma marca real seria afirmar sobre um produto que
existe.
