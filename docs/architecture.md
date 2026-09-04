# Catalog architecture

The catalog keeps a commercial cigar distinct from the presentation a person
actually smokes. This makes the hierarchy useful without turning product names
or personal observations into unsupported facts.

```text
Brand → CigarLine → Cigar → CigarVariant → Vitola
```

For V1, a Cigar document owns the `brand` and `line` identifiers as well as its
own `id` and name. Separate Brand and CigarLine records may later supply their
own metadata; they do not own the cigar's blend, release, availability, or
declared profile. `Cigar` is the commercial product and its normal blend.
`CigarVariant` is a named, smokeable presentation of that product. Its `vitola`
describes that presentation.

## Sessions belong to a variant

A `SmokeSession` references `CigarVariant`, never Cigar directly. A smoking
record needs the exact size and presentation that was smoked, even when several
variants share the same commercial cigar and normal blend. The session remains
a personal record; it does not establish or change catalog facts.

## Blend ownership and the evidence gate

The Cigar owns the ordinary `blend`, split into wrapper, binder, and filler
components. A component preserves the source label and follows the distinctions
in the [tobacco taxonomy](taxonomy.md). A variant may use `blendOverride` only
when it includes a complete replacement blend **and** a nonempty field-level
evidence list. That gate prevents a size-specific blend from being inferred
from a name, a retailer listing, or a smoking impression. Evidence records use
the [evidence model](evidence-model.md): each points to a captured source and
qualifies a specific claim.

## Vitola fields are intentionally separate

`vitola.commercialName` is the published presentation name. `factoryName` is a
separate optional factory designation; `shape`, `lengthMm`, and `ringGauge` are
also independent optional fields. Unknown values are `null`. A commercial name
such as “Robusto” does not prove a factory name, dimensions, shape, or ring
gauge. Record those values only when the relevant source supports them.

## Release is not availability

`release.productionStatus` describes whether the manufacturer identifies the
cigar as current, discontinued, seasonal, or unknown. `availability.status`
describes where or how it can be obtained at the time supported by its evidence.
A discontinued cigar can still be available in a secondary market; a current
cigar can be temporarily unavailable. Keep evidence for these distinct claims
on their respective fields.

`declaredProfile` is likewise distinct: it records a manufacturer-declared
strength, body, flavor intensity, or notes, with evidence. It is not a personal
rating or a substitute for a SmokeSession observation.
