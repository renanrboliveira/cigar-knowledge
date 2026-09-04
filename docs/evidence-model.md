# Evidence model

A **Source** describes a document or publication. It carries its identity and
publication metadata, but no global confidence rating.

An **Evidence** record qualifies a specific claim by connecting a source to a
field, relation, confidence, claim type, and status. `rawLabel` preserves the
source wording when useful, and `note` captures concise context.

Conflicting evidence is retained: records that support and contradict the same
field stay side by side instead of silently choosing one source.
