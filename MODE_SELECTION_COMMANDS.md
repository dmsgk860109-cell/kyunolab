# Kyunolab Mode Selection Commands

Mode selection commands are optional aliases for choosing a Kyunolab article generation mode.

They do not replace the existing publishing workflow.

If the user asks for a new article without specifying a mode, continue using the existing normal generation rules.

## Original Archive Mode Aliases

Treat any of these commands as a request for Kyunolab Original Archive Mode:

- 창작
- 창작글
- 오리지널
- Original

Mode result:

```yaml
generationMode: original-archive
```

When Original Archive Mode is selected, keep the mode fixed.

Do not switch the request to Canonical Archive Mode because a related famous legend appears in research.

Research is used only to study motifs, structures, settings, repeated scenes, and similarity risks.

The final article must be a new Kyunolab Original Archive record.

## Canonical Archive Mode Aliases

Treat any of these commands as a request for Kyunolab Canonical Archive Mode:

- 기록
- 기록글
- 유명
- 유명글
- Canonical

Mode result:

```yaml
generationMode: canonical-archive
```

When Canonical Archive Mode is selected, keep the mode fixed.

Do not switch the request to Original Archive Mode.

The article must be based on an existing known legend, ghost story, myth, folklore subject, mystery, internet legend, or historically known strange record.

Research and source review are required before drafting.

## Examples

Interpret these as Original Archive Mode:

- "창작"
- "창작 하나 작성"
- "새 글 발행 - 창작"
- "오리지널 도시전설 하나 작성"
- "Original article"

Interpret these as Canonical Archive Mode:

- "기록"
- "기록 하나 작성"
- "유명"
- "유명글 하나 작성"
- "새 글 발행 - 기록"
- "유명한 전설 하나 작성"
- "Canonical article"

Interpret these as the existing default generation flow:

- "새 글 발행"
- "글 하나 작성"
- "새로운 글 작성"
- "각 카테고리에 1개씩 새 글 발행"

## Mode Priority Rule

If the user explicitly selects a mode, that mode has priority.

Do not override the selected mode based on assistant preference, search results, topic familiarity, or perceived SEO value.

If the user selects Original Archive Mode:

- execute only Original Archive Mode
- research for motif analysis only
- do not write an existing famous legend
- do not convert the request to Canonical Mode

If the user selects Canonical Archive Mode:

- execute only Canonical Archive Mode
- research and write about the existing known subject
- do not invent a new legend
- do not convert the request to Original Mode

Mode aliases are a convenience layer. They add Korean and short-form commands without changing the existing article generation system.
