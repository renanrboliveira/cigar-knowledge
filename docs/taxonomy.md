# Tobacco taxonomy

This glossary keeps reusable tobacco identities separate from statements about
a particular blend component. Preserve a source's complete wording in
`rawLabel`, then record only the supported parts in the applicable fields.
Unknown is a valid value and is preferable to inference.

| Field | Meaning | Not a substitute for |
| --- | --- | --- |
| Identity | The reusable tobacco identity, such as Connecticut Shade or San Andrés. | A place, cultivar, growing method, process, or blend role. |
| Origin / terroir | Where a component was grown: country, region, subregion, farm, and, where evidence supports it, terroir context. | Identity or genetics. |
| Genetics / cultivar | The named cultivar or lineage of the plant. | A geography or a trade label. |
| Cultivation | How the tobacco was grown, such as shade. | Processing or color. |
| Processing | Post-harvest treatment or designation, such as maduro. | Cultivation, descriptor/color, or priming. |
| Descriptor / color | A descriptive or visual label, including color when a source provides one. | A processing claim unless the source supports processing separately. |
| Priming | The plant position or leaf pick, such as ligero. | A tobacco identity or blend role. |
| Crop | The harvest or crop designation, when a source identifies it. | Origin or processing. |
| Role | A component's use in one blend: wrapper, binder, or filler. | A reusable tobacco identity property. |

## Decomposition examples

The tables retain the raw source label while showing the appropriate field
separation. They do not add facts beyond the stated label and its supported
decomposition.

### Ecuadorian Connecticut Shade

| Raw label | Identity | Origin | Genetics | Cultivation | Processing | Descriptor / color | Priming | Crop | Role |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ecuadorian Connecticut Shade | Connecticut Shade | countryCode: `EC` | Unknown | method: `shade` | Unknown | Unknown | Unknown | Unknown | Component-specific; not implied by the identity |

### Mexican San Andrés Maduro

| Raw label | Identity | Origin | Genetics | Cultivation | Processing | Descriptor / color | Priming | Crop | Role |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mexican San Andrés Maduro | San Andrés | countryCode: `MX` | Unknown | Unknown | `maduro` | Unknown | Unknown | Unknown | Component-specific; not implied by the identity |

### Ligero

| Raw label | Identity | Origin | Genetics | Cultivation | Processing | Descriptor / color | Priming | Crop | Role |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Corojo Ligero | Corojo | Unknown | Unknown | Unknown | Unknown | Unknown | `ligero` | Unknown | Component-specific; not implied by the identity |

Ligero belongs in `priming`; it must not be used as `tobaccoId`.

### Nicaraguan-only label

| Raw label | Identity | Origin | Genetics | Cultivation | Processing | Descriptor / color | Priming | Crop | Role |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Nicaraguan | Unknown | countryCode: `NI` | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | Component-specific; not implied by the label |

An origin-only label does not establish a tobacco identity, cultivar, or any
other attribute.
