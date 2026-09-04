---
schemaVersion: 1
id: synthetic-ember-arc-no-1
brand: synthetic-ember-arc
line: synthetic-ember-arc-core
name: Synthetic Ember Arc No. 1
blend:
  wrapper:
    - tobaccoId: synthetic-example-wrapper
      rawLabel: Synthetic Example Wrapper
      role: wrapper
      evidence:
        - sourceId: example-manufacturer-source
          field: /blend/wrapper/0
          relation: supports
          confidence: high
          claimType: manufacturer_claim
          status: supported
          rawLabel: Synthetic Example Wrapper
          note: Synthetic manufacturer wording retained for this demonstration.
  binder:
    - tobaccoId: synthetic-example-binder
      rawLabel: Synthetic Example Binder
      role: binder
      evidence:
        - sourceId: example-manufacturer-source
          field: /blend/binder/0
          relation: supports
          confidence: high
          claimType: manufacturer_claim
          status: supported
          rawLabel: Synthetic Example Binder
          note: Synthetic manufacturer wording retained for this demonstration.
  filler:
    - tobaccoId: synthetic-example-filler
      rawLabel: Synthetic Example Filler
      role: filler
      evidence:
        - sourceId: example-manufacturer-source
          field: /blend/filler/0
          relation: supports
          confidence: high
          claimType: manufacturer_claim
          status: supported
          rawLabel: Synthetic Example Filler
          note: Synthetic manufacturer wording retained for this demonstration.
release:
  releaseYear: 2026
  limitedEdition: false
  commemorative: false
  editionName: null
  anniversary: null
  productionStatus: current
  evidence:
    - sourceId: example-manufacturer-source
      field: /release/productionStatus
      relation: supports
      confidence: high
      claimType: manufacturer_claim
      status: supported
      rawLabel: Current synthetic portfolio item
      note: Synthetic release information for this documentation example.
availability:
  status: synthetic-direct-catalog
  evidence:
    - sourceId: example-manufacturer-source
      field: /availability/status
      relation: supports
      confidence: high
      claimType: manufacturer_claim
      status: supported
      rawLabel: Synthetic direct catalog
      note: Synthetic availability information for this documentation example.
declaredProfile:
  strength: 3
  body: 3
  flavorIntensity: 3
  manufacturerNotes: Synthetic manufacturer-declared profile; not a tasting observation.
  evidence:
    - sourceId: example-manufacturer-source
      field: /declaredProfile
      relation: supports
      confidence: high
      claimType: manufacturer_claim
      status: supported
      rawLabel: Synthetic balanced profile
      note: Synthetic profile information for this documentation example.
variants:
  - id: synthetic-ember-arc-no-1-robusto
    name: Synthetic Ember Arc No. 1 Robusto
    vitola:
      commercialName: Synthetic Robusto
      factoryName: null
      shape: null
      lengthMm: null
      ringGauge: null
  - id: synthetic-ember-arc-no-1-lancero
    name: Synthetic Ember Arc No. 1 Lancero
    vitola:
      commercialName: Synthetic Lancero
      factoryName: Synthetic Factory Lancero
      shape: parejo
      lengthMm: 178
      ringGauge: 38
---

# Synthetic Ember Arc No. 1

This is a fully synthetic catalog example. The brand, line, cigar, blend,
release, availability, profile, variants, dimensions, labels, and evidence
notes are invented solely to demonstrate the schema. They make no claim about
an actual cigar or manufacturer.

Every evidence record deliberately resolves to the captured synthetic
[Example Manufacturer Product Page](../sources/manufacturers/example-manufacturer-source.md).
The Robusto leaves dimensions unknown as `null`; the Lancero records explicitly
supplied synthetic dimensions. Neither vitola name is used to infer dimensions.
