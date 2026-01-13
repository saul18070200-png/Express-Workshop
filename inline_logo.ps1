$base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes('c:\Users\saul1\OneDrive\Documentos\CasaSoftware\assets\images\logo.png'))
$dataUri = "data:image/png;base64,$base64"
$htmlPath = 'c:\Users\saul1\OneDrive\Documentos\CasaSoftware\index.html'
$html = Get-Content -Path $htmlPath -Raw

# Replace both occurrences (Header and Footer)
$newHtml = $html -replace '<img src="assets/images/logo.png" alt="NOVAX Logo" fetchpriority="high">', "<img src=`"$dataUri`" alt=`"NOVAX Logo`" fetchpriority=`"high`">"
$newHtml = $newHtml -replace '<img src="assets/images/logo.png" alt="NOVAX" class="footer__logo">', "<img src=`"$dataUri`" alt=`"NOVAX`" class=`"footer__logo`">"

$newHtml | Set-Content -Path $htmlPath -Encoding utf8 -NoNewline
Write-Host "Logo successfully inlined into index.html"
