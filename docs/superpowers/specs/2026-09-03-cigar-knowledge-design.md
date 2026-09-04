# Cigar Knowledge Architecture

## Objetivo

Criar uma knowledge base versionada em Git para charutos, consumível por
Obsidian, Claude/AI e, futuramente, por um catálogo de charutos. A knowledge
base é a fonte canônica de conhecimento técnico; registros pessoais permanecem
separados dos fatos do catálogo.

## Princípios

1. Markdown é a representação humana e YAML frontmatter é a representação estruturada.
2. A knowledge base é a fonte canônica de conhecimento técnico.
3. Dados pessoais de fumadas não alteram fatos do catálogo.
4. Unknown/null é preferível a inventar informação.
5. Preservar sempre o raw label original das fontes.
6. Não misturar:
   - identidade do tabaco;
   - origem/terroir;
   - genética/cultivar;
   - cultivo;
   - processamento;
   - descriptor/cor;
   - priming;
   - papel no blend.
7. Strength, body e flavor intensity são dimensões independentes.
8. Não inferir causalidade sensorial sem evidência.
9. Sem gamificação que incentive frequência ou quantidade de fumadas.

## Modelo de tabaco

### Tobacco

`Tobacco` representa uma identidade reutilizável:

```text
Tobacco
├── identity
├── origin
├── genetics
├── aliases
└── sources
```

O papel `wrapper`/`binder`/`filler` não pertence a `Tobacco`.

### TobaccoComponent

`TobaccoComponent` representa o uso daquela folha em um blend específico:

```text
TobaccoComponent
├── tobaccoId
├── rawLabel
├── role
├── origin
├── genetics
├── cultivation
├── processing
├── descriptor
├── priming
├── crop
└── evidence
```

Regras e exemplos importantes:

- Mata Fina pode ser wrapper, binder ou filler.
- Ligero não é um tipo de tabaco; é priming.
- Connecticut Shade e Connecticut Broadleaf devem ser identidades distintas.
- “Ecuadorian Connecticut Shade” deve preservar `rawLabel` e separar origem
  `EC`, identidade Connecticut Shade e cultivo `shade` quando suportado.
- “Mexican San Andrés Maduro” deve separar San Andrés, México e processamento
  Maduro.
- Se a fonte disser apenas “Nicaraguan”, registrar apenas o que sabemos. Não
  inventar variedade ou genética.

## Source → Evidence → Claim

Não colocar confiança global em `Source`.

`Source` representa o documento ou publicação. Tipos iniciais:

- `manufacturer`
- `official_distributor`
- `government_or_regulatory`
- `book`
- `academic`
- `specialized_media`
- `retailer`
- `community`
- `user`

`Evidence` representa a relação da fonte com um claim ou campo.

`relation`:

- `supports`
- `contradicts`
- `mentions`

`confidence`:

- `high`
- `medium`
- `low`

`claimType`:

- `fact`
- `manufacturer_claim`
- `sensory_description`
- `expert_consensus`
- `personal_observation`
- `hypothesis`

`status`:

- `confirmed`
- `supported`
- `disputed`
- `unverified`
- `unknown`

Quando fontes discordarem, preservar a divergência em vez de escolher
silenciosamente.

## Modelo de catálogo

Hierarquia aprovada:

```text
Brand
→ CigarLine
→ Cigar
→ CigarVariant
→ Vitola
```

- `Cigar` representa o produto/blend comercial.
- `CigarVariant` representa a apresentação específica que é fumada.
- `SmokeSession` sempre referencia `CigarVariant`.
- `Blend`, `Release` e `DeclaredProfile` pertencem principalmente ao `Cigar`.
- `CigarVariant` pode ter override de blend somente quando houver evidência.
- `DeclaredProfile` deve ficar separado da percepção pessoal.

### Vitola

`Vitola` deve separar:

- common/commercial name;
- factory vitola, quando aplicável;
- shape;
- `lengthMm`;
- `ringGauge`.

Nunca inferir ring gauge ou dimensão pelo nome comercial.

### Release

`Release` deve suportar:

- `releaseYear`;
- `limitedEdition`;
- `commemorative`;
- `editionName`;
- anniversary, quando aplicável;
- production status.

Production status e availability são conceitos separados.

### Blend

```yaml
blend:
  wrapper: TobaccoComponent[]
  binder: TobaccoComponent[]
  filler: TobaccoComponent[]
```

## SmokeSession

Um único modelo suporta os modos Quick e Guided:

```text
SmokeSession
├── cigarVariantId
├── mode
├── status
├── timing
├── Context
├── Preparation
├── PreLight
├── Stage[]
│   ├── SensorySnapshot
│   ├── Retrohale
│   └── Construction
└── FinalEvaluation
```

`mode`:

- `quick`
- `guided`

`status`:

- `planned`
- `in_progress`
- `completed`
- `abandoned`

Stages devem ser um array extensível. Na V1:

- `first_third`
- `second_third`
- `final_third`

### SensorySnapshot

- strength de 1 a 5;
- body de 1 a 5;
- flavor intensity de 1 a 5;
- texture;
- `FlavorObservation[]`;
- notes.

Não usar uma escala obrigatória de 0 a 100.

### FlavorObservation

- family;
- descriptor opcional;
- intensity opcional;
- discovery opcional.

`discovery`:

- `spontaneous`
- `prompted`

Taxonomia sensorial pequena para a V1:

- `woody`
- `earthy`
- `roasted`
- `sweet`
- `spicy`
- `nutty`
- `creamy`
- `fruity`
- `vegetal`
- `floral`
- `leather`
- `mineral`

Retrohale é separado das notas percebidas normalmente.

### Construction

Draw semântico:

- `very_tight`
- `tight`
- `ideal`
- `open`
- `very_open`

Outros atributos:

- burn quality;
- eventos como `touch_up`, `relight`, `canoeing` e `tunneling`;
- smoke output;
- perceived heat.

### NicotineImpact

`NicotineImpact` é separado de strength:

- `none`
- `light`
- `noticeable`
- `strong`
- `excessive`

### FinalEvaluation

- enjoyment;
- balance;
- complexity;
- evolution;
- construction;
- `bestStage`;
- `wouldSmokeAgain`;
- `wouldBuyAgain`;
- `dominantFlavorFamilies`;
- `overallImpression`.

Um resumo automático de fumada só pode usar notas realmente registradas pelo
usuário. Nunca inventar descritores.

## Learning e comparação

### ComparisonCandidate

```text
ComparisonCandidate
├── cigarVariantA
├── cigarVariantB
├── similarities[]
├── differences[]
├── learningGoals[]
└── comparability
```

`learningGoals` iniciais:

- `wrapper-comparison`
- `binder-comparison`
- `filler-comparison`
- `terroir-comparison`
- `same-tobacco-different-role`
- `same-tobacco-different-producer`
- `same-brand-different-line`
- `same-cigar-different-vitola`
- `same-cigar-repeat-session`
- `shade-vs-sun-grown`
- `natural-vs-maduro`
- `strength-vs-body`
- `blend-complexity`
- `country-style-comparison`

`comparability`:

- `low`
- `medium`
- `high`

Comparability significa quantidade e relevância de variáveis controladas, não
certeza científica.

### LearningPath

`LearningPath` deve ser editorial e curado.

Observation prompts devem evitar suggestion bias.

Exemplo correto:

> Observe se surgem notas da família torrada.

Exemplo incorreto:

> Você vai sentir chocolate.

`PreferenceSignal` fica para a V2. Nunca concluir “você gosta de Mata Fina” com
uma única sessão.

## Estrutura alvo do repositório

```text
cigar-knowledge/
├── README.md
├── CLAUDE.md
├── docs/
│   ├── architecture.md
│   ├── taxonomy.md
│   ├── evidence-model.md
│   ├── contribution-guide.md
│   └── superpowers/
│       ├── specs/
│       └── plans/
├── schema/
│   ├── common.schema.yaml
│   ├── source.schema.yaml
│   ├── evidence.schema.yaml
│   ├── tobacco.schema.yaml
│   ├── cigar.schema.yaml
│   ├── smoke-session.schema.yaml
│   └── learning-path.schema.yaml
├── knowledge/
│   ├── concepts/
│   ├── tobaccos/
│   ├── terroirs/
│   ├── brands/
│   ├── cigars/
│   ├── sensory/
│   └── learning/
│       ├── paths/
│       └── comparisons/
├── personal/
│   ├── cellar/
│   ├── smoke-sessions/
│   ├── learning-notes/
│   └── comparisons/
├── sources/
│   ├── manufacturers/
│   ├── books/
│   ├── specialized-media/
│   └── bibliography.md
└── examples/
    ├── cigar.example.md
    ├── tobacco.example.md
    └── smoke-session.example.md
```

## Estratégia de schemas da V1

Schemas:

- `source.schema.yaml`
- `evidence.schema.yaml`
- `tobacco.schema.yaml`
- `cigar.schema.yaml`
- `smoke-session.schema.yaml`
- `learning-path.schema.yaml`

`TobaccoComponent`, `Blend`, `Vitola`, `SensorySnapshot` e
`FlavorObservation` podem inicialmente ser definições internas dos schemas
principais.

Todo documento estruturado deve ter:

```yaml
schemaVersion: 1
```

IDs editoriais devem ser slugs legíveis. `SmokeSession` pode usar ID
transacional/UUID posteriormente.

## Casos reais para validar o design

O modelo precisa conseguir representar corretamente, sem inventar dados:

1. **Dona Flor Puro Mata Fina** — mesmo tabaco em wrapper, binder e filler.
2. **Brick House Double Connecticut** — Connecticut Shade vs. Connecticut Broadleaf.
3. **Sobremesa Brûlée** — wrapper, binder e filler com identidades/origens diferentes.
4. **AVO Syncro Nicaragua** — blend multinacional.
5. **Arturo Fuente Magnum R44** — origem, Habano, Rosado e Sun Grown sem transformar tudo em um único “tipo”.
6. **Montecristo 80 Aniversario** — edição comemorativa, release, vitola e dados limitados.
7. **Dannemann Terroir Brasil** — fontes divergentes e status `disputed`.

Depois, a coleção atual deve virar seed data:

- Joya de Nicaragua Clásico Original Robusto
- Brick House Double Connecticut Toro
- Sobremesa Brûlée Robusto
- Dannemann Mata Fina Robusto
- Dona Flor Robusto Puro Mata Fina
- Dona Flor Seleção Robusto
- Dannemann Robusto Santo Antônio
- Dannemann Terroir Brasil Santo Antônio Montesco
- Romeo y Julieta Romeo No. 3 Tubos
- Arturo Fuente Rosado Sun Grown Magnum R44
- Joya de Nicaragua Clásico Medio Siglo Toro
- AVO Syncro Nicaragua Robusto
- CAO Consigliere Associate Robusto
- Montecristo 80 Aniversario
- Oliva Serie V Melanio Maduro Robusto

Não usar os detalhes técnicos acima como verdade se não houver source.
Pesquisar e registrar evidência quando chegar à fase de seed knowledge.

## Escopo da V1

A V1 deve resolver bem:

1. representação de tabacos;
2. blends;
3. provenance/evidence;
4. smoke sessions;
5. comparação e learning paths simples.

## Fora do escopo atual

Não implementar agora:

- palate profile;
- `PreferenceSignal`;
- ML;
- embeddings/vector DB;
- social feed;
- followers;
- ranking global;
- badges;
- streaks;
- metas de consumo;
- recommendation engine sofisticado;
- taxonomia sensorial gigantesca;
- score obrigatório de 0 a 100.

## Regras futuras para CLAUDE.md

O futuro `CLAUDE.md` deve conter regras equivalentes a:

1. Never invent cigar blend information.
2. Preserve raw manufacturer labels.
3. Separate facts from sensory claims.
4. Prefer primary sources.
5. Record evidence for technical claims.
6. Unknown is valid.
7. Do not conflate identity, origin, genetics, cultivation, processing, priming, descriptor or role.
8. Never infer flavor causality without evidence.
9. Personal smoke observations remain personal observations.
10. Preserve source disagreement.
