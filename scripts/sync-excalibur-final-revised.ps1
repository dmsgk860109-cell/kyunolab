param(
  [switch] $MetadataOnly
)

$repo = 'C:\Users\lucid\Documents\Codex\2026-07-01\new-chat\work\kyunolab-repo'
$outputPath = 'C:\Users\lucid\Documents\Codex\2026-07-26\new-chat\outputs\excalibur-mythic-object-final-revised.md'
$storiesPath = Join-Path $repo 'data\stories.json'
$storySlug = 'excalibur-sword-legend'
$publishDate = '2026-07-26'

function Get-Block {
  param(
    [string] $text,
    [string] $start,
    [string[]] $stopMarkers
  )

  $startToken = "## $start"
  $startIndex = $text.IndexOf($startToken)
  if ($startIndex -lt 0) { return '' }

  $slice = $text.Substring($startIndex + $startToken.Length)
  $slice = $slice.TrimStart([char]10, [char]13)

  $cut = $slice.Length
  foreach ($marker in $stopMarkers) {
    $markerToken = "`n## $marker"
    $idx = $slice.IndexOf($markerToken)
    if ($idx -ge 0 -and $idx -lt $cut) {
      $cut = $idx
    }
  }

  return $slice.Substring(0, $cut).Trim()
}

function To-Slug {
  param([string] $value)
  if ([string]::IsNullOrWhiteSpace($value)) { return 'section' }
  $v = $value.ToLower()
  $v = $v -replace "'", ''
  $v = $v -replace '"', ''
  $v = $v -replace '&', 'and'
  $v = $v -replace '[^a-z0-9]+', '-'
  $v = $v -replace '(^-|-$)', ''
  return $v
}

function Normalize-Paragraphs {
  param([string] $block)
  if ([string]::IsNullOrWhiteSpace($block)) { return @() }
  $parts = $block -split "`r?`n`r?`n+"
  $paras = @()
  foreach ($part in $parts) {
    $clean = ($part -replace "[`r`n]", ' ') -replace '\s+', ' '
    $clean = $clean.Trim()
    if ($clean) { $paras += $clean }
  }
  return $paras
}

function Parse-Section {
  param([string] $bodyText)
  $sections = @()
  $currentTitle = 'Excalibur'
  $currentLines = @()

  $lines = $bodyText -split "`r?`n"
  foreach ($line in $lines) {
    if ($line -match '^\s*##\s+(.+)$') {
      if ($currentLines.Count -gt 0) {
        $paras = Normalize-Paragraphs ($currentLines -join "`n")
        if ($paras.Count -gt 0) {
          $sections += [pscustomobject]@{
            id = To-Slug $currentTitle
            heading = $currentTitle
            paragraphs = $paras
          }
        }
        $currentLines = @()
      }
      $currentTitle = $matches[1].Trim()
      continue
    }
    if ($line.Trim() -eq '') { continue }
    $currentLines += $line
  }

  if ($currentLines.Count -gt 0) {
    $paras = Normalize-Paragraphs ($currentLines -join "`n")
    if ($paras.Count -gt 0) {
      $sections += [pscustomobject]@{
        id = To-Slug $currentTitle
        heading = $currentTitle
        paragraphs = $paras
      }
    }
  }

  if ($sections.Count -eq 0) {
    $paras = Normalize-Paragraphs $bodyText
    $sections = @([pscustomobject]@{
      id = 'story-body'
      heading = 'Excalibur'
      paragraphs = $paras
    })
  }

  return $sections
}

function Parse-QA {
  param([string] $qaText)
  $qa = @()
  if ([string]::IsNullOrWhiteSpace($qaText)) { return $qa }

  $lines = $qaText -split "`r?`n"
  $question = $null
  $pendingAnswer = $null

  foreach ($line in $lines) {
    $trimmed = $line.Trim()
    if ($line -match '^-\s+(.+)$') {
      if ($question -and $pendingAnswer) {
        $qa += [pscustomobject]@{ question = $question; answer = $pendingAnswer.Trim() }
      }
      $question = $matches[1].Trim()
      $pendingAnswer = $null
      continue
    }

    if ($question -and $line -match '^\s+-\s+(.+)$') {
      $answer = $matches[1].Trim()
      if (-not $pendingAnswer) {
        $pendingAnswer = $answer
      } else {
        $pendingAnswer = ($pendingAnswer + ' ' + $answer).Trim()
      }
    }
  }

  if ($question -and $pendingAnswer) {
    $qa += [pscustomobject]@{ question = $question; answer = $pendingAnswer.Trim() }
  }

  return $qa
}

function Parse-ListItems {
  param([string] $block)
  if ([string]::IsNullOrWhiteSpace($block)) { return @() }
  $items = @()
  foreach ($line in ($block -split "`r?`n")) {
    if ($line -match '^\s*[-*]\s+(.+)$') {
      $items += $matches[1].Trim()
    }
  }
  return $items
}

$raw = Get-Content $outputPath -Raw -Encoding utf8
$text = $raw -replace "`r", ''

$rawTitle = if ($text -match '(?m)^#\s*(.+)$') { $Matches[1].Trim() } else { 'Excalibur' }
$storyBodyText = Get-Block -text $text -start 'STORY_BODY' -stopMarkers @('Quick Answer', 'Q&A', 'Source Note', 'Sources', 'Related Keywords')
$quickAnswer = Get-Block -text $text -start 'Quick Answer' -stopMarkers @('Q&A', 'Source Note', 'Sources', 'Related Keywords')
$qaText = Get-Block -text $text -start 'Q&A' -stopMarkers @('Source Note', 'Sources', 'Related Keywords')
$sourceNoteText = Get-Block -text $text -start 'Source Note' -stopMarkers @('Sources', 'Related Keywords')
$sourcesText = Get-Block -text $text -start 'Sources' -stopMarkers @('Related Keywords')
$keywordsText = Get-Block -text $text -start 'Related Keywords' -stopMarkers @()

$sections = Parse-Section $storyBodyText
$qa = Parse-QA $qaText
$sourceNote = ($sourceNoteText -replace '\s+', ' ').Trim()
$sourceItems = Parse-ListItems $sourcesText
$relatedKeywords = Parse-ListItems $keywordsText

$stories = Get-Content $storiesPath -Raw -Encoding utf8 | ConvertFrom-Json
$story = $stories | Where-Object { $_.slug -eq $storySlug }
if (-not $story) { throw "Story not found: $storySlug" }
if ($story -is [System.Collections.IEnumerable] -and -not ($story -is [string])) {
  $story = $story | Select-Object -First 1
}

$intro = if ($sections.Count -gt 0 -and $sections[0].paragraphs.Count -gt 0) { $sections[0].paragraphs[0] } else { 'Excalibur: Drawn from the Lake, Worn in War, Returned to the Water.' }
$summary = if ($quickAnswer) { ($quickAnswer -replace '\s+', ' ').Trim() } else { $intro }

$story | Add-Member -Force -NotePropertyName 'title' -NotePropertyValue $rawTitle
$story | Add-Member -Force -NotePropertyName 'displayTitle' -NotePropertyValue $rawTitle
$story | Add-Member -Force -NotePropertyName 'h1' -NotePropertyValue $rawTitle
$story | Add-Member -Force -NotePropertyName 'seoTitle' -NotePropertyValue $rawTitle
$story | Add-Member -Force -NotePropertyName 'metaTitle' -NotePropertyValue $rawTitle
$story | Add-Member -Force -NotePropertyName 'updatedAt' -NotePropertyValue $publishDate
$story | Add-Member -Force -NotePropertyName 'introSummary' -NotePropertyValue $intro
$story | Add-Member -Force -NotePropertyName 'summaryAnswer' -NotePropertyValue $summary
$story | Add-Member -Force -NotePropertyName 'storySourceNote' -NotePropertyValue $sourceNote
$story | Add-Member -Force -NotePropertyName 'relatedKeywords' -NotePropertyValue $relatedKeywords
$story | Add-Member -Force -NotePropertyName 'tags' -NotePropertyValue $relatedKeywords
$secondaryKeywords = if ($relatedKeywords.Count -gt 0) { $relatedKeywords } else { $story.secondaryKeywords }
$story | Add-Member -Force -NotePropertyName 'secondaryKeywords' -NotePropertyValue $secondaryKeywords
$story | Add-Member -Force -NotePropertyName 'detail' -NotePropertyValue 'the Lady of the Lake gift, Excalibur in statecraft and war, the lost scabbard, and Bedivere returning the sword to the lake'
$story | Add-Member -Force -NotePropertyName 'excerpt' -NotePropertyValue $summary
$story | Add-Member -Force -NotePropertyName 'metaDescription' -NotePropertyValue $summary

$refs = @()
foreach ($item in $sourceItems) {
  $refs += [pscustomobject]@{ title = $item; url = 'https://kyunolab.com/stories/excalibur-sword-legend' }
}

$longformArticle = if ($story.longformArticle) { $story.longformArticle } else { [pscustomobject]@{} }
if (-not $MetadataOnly) {
  $longformArticle | Add-Member -Force -NotePropertyName 'storyBody' -NotePropertyValue $sections
}
$longformArticle | Add-Member -Force -NotePropertyName 'supplementarySections' -NotePropertyValue @()
$longformArticle | Add-Member -Force -NotePropertyName 'qa' -NotePropertyValue $qa
$longformArticle | Add-Member -Force -NotePropertyName 'storySourceNote' -NotePropertyValue $sourceNote
$longformArticle | Add-Member -Force -NotePropertyName 'references' -NotePropertyValue $refs
$story | Add-Member -Force -NotePropertyName 'longformArticle' -NotePropertyValue $longformArticle
$story | Add-Member -Force -NotePropertyName 'qa' -NotePropertyValue $qa

$story.contentDNA = if ($story.contentDNA) { $story.contentDNA } else { @{} }
if (-not $MetadataOnly) {
  $story.contentDNA | Add-Member -Force -NotePropertyName 'sectionBlueprint' -NotePropertyValue @(
    $sections | ForEach-Object { [pscustomobject]@{ title = $_.heading; nav = $_.heading } }
  )
}

$stories | ConvertTo-Json -Depth 50 | Set-Content -Path $storiesPath -Encoding utf8
Write-Output 'UPDATED_STORY_JSON'
