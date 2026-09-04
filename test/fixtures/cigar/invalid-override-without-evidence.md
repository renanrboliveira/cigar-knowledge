---
schemaVersion: 1
id: synthetic-cigar-with-invalid-override
brand: synthetic-brand
line: synthetic-line
name: Synthetic Cigar With Invalid Override
blend: null
variants:
  - id: synthetic-cigar-with-invalid-override-robusto
    name: Robusto
    vitola:
      commercialName: Robusto
    blendOverride:
      blend:
        wrapper:
          - tobaccoId: mata-fina
            rawLabel: Mata Fina
            role: wrapper
        binder:
          - tobaccoId: mata-fina
            rawLabel: Mata Fina
            role: binder
        filler:
          - tobaccoId: mata-fina
            rawLabel: Mata Fina
            role: filler
---

# Invalid Synthetic Override

Synthetic fixture for an override that has no evidence record.
