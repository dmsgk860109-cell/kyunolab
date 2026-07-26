$outputPath = 'C:\Users\lucid\Documents\Codex\2026-07-26\new-chat\outputs\excalibur-mythic-object-final-revised.md'
$repo = 'C:\Users\lucid\Documents\Codex\2026-07-01\new-chat\work\kyunolab-repo'
$oldTitle = 'Excalibur: Arthurian Sword, Symbolism, and the Mythic Object That Chooses a King'
$newTitle = 'Excalibur: Drawn from the Lake, Worn in War, Returned to the Water'
$publishDate = 'Updated July 26, 2026'

Add-Type -AssemblyName System.Web
function Escape-Html {
  param([string] $value)
  return [System.Web.HttpUtility]::HtmlEncode($value)
}

$rawOutput = Get-Content $outputPath -Raw -Encoding utf8
$titleMatch = [regex]::Match($rawOutput, '(?m)^#\s*(.+)$')
$title = if ($titleMatch.Success) { $titleMatch.Groups[1].Value.Trim() } else { $newTitle }
$storyMatch = [regex]::Match($rawOutput, '##\s*STORY_BODY\s*[\r\n]+([\s\S]*?)(?=\r?\n##\s*(Quick Answer|Q&A|Source Note|Sources|Related Keywords)|\z)')
$quickMatch = [regex]::Match($rawOutput, '##\s*Quick Answer\s*[\r\n]+([\s\S]*?)(?=\r?\n##\s*(Q&A|Source Note|Sources|Related Keywords)|\z)')

if (-not $storyMatch.Success) {
  throw 'Failed to extract STORY_BODY from output file.'
}

$storyBodyText = $storyMatch.Groups[1].Value.Trim()
$deckText = if ($quickMatch.Success) {
  ($quickMatch.Groups[1].Value -replace '\s+', ' ').Trim()
} else {
  ($storyBodyText -split "`r?`n`r?`n+" | Select-Object -First 1).Trim()
}

$paras = @()
($storyBodyText -split "`r?`n`r?`n+") | ForEach-Object {
  $clean = ($_ -replace "[`r`n]", ' ' -replace '\s+', ' ').Trim()
  if ($clean) { $paras += "<p>" + (Escape-Html $clean) + "</p>" }
}

$bodyHtml = @(
  '          <div class="story-body archive-entry">'
  '          ' + ($paras -join "`r`n          ")
  '        </div>'
) -join "`r`n"

$htmlFiles = @(
  Join-Path $repo 'stories\excalibur-sword-legend.html'
  Join-Path $repo 'dist\stories\excalibur-sword-legend.html'
)

foreach ($htmlPath in $htmlFiles) {
  $html = Get-Content $htmlPath -Raw -Encoding utf8
  $html = $html -replace [regex]::Escape($oldTitle), [System.Text.RegularExpressions.Regex]::Escape($newTitle).Replace('\', '')
  $html = $html -replace '(?s)<title>.*?</title>', "<title>$newTitle | Kyunolab</title>"
  $html = $html -replace '(?s)<p class="deck">.*?</p>', "<p class=`"deck`">$deckText</p>"
  $html = $html -replace '(?s)<p class="article-updated">Updated[^<]*</p>', "<p class=`"article-updated`">$publishDate</p>"
  $html = $html -replace '(?s)<div class="story-body archive-entry">.*?<section class="related-articles">', "$bodyHtml`r`n        <section class=`"related-articles`">"
  Set-Content $htmlPath -Value $html -Encoding utf8
  Write-Output "UPDATED_HTML:$htmlPath"
}
