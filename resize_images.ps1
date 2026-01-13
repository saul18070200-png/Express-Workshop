Add-Type -AssemblyName System.Drawing
$imagesDir = "c:\Users\saul1\OneDrive\Documentos\CasaSoftware\assets\images"
$files = Get-ChildItem -Path $imagesDir -Filter *.png
foreach ($file in $files) {
    if ($file.Name -like "*logo*" -or $file.Name -like "*_small*") { continue }
    try {
        $img = [System.Drawing.Image]::FromFile($file.FullName)
        $newWidth = 300 # Even smaller for instant speed
        $newHeight = [int]($img.Height * ($newWidth / $img.Width))
        $bmp = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
        $graph = [System.Drawing.Graphics]::FromImage($bmp)
        
        # Lower quality interpolation for faster rendering/smaller size
        $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::Low
        $graph.DrawImage($img, 0, 0, $newWidth, $newHeight)
        
        $newName = $file.BaseName + "_small.png"
        $newPath = Join-Path $imagesDir $newName
        
        # Save as JPEG-like PNG (system drawing doesn't give much raw PNG compression control, but size helps)
        $bmp.Save($newPath, [System.Drawing.Imaging.ImageFormat]::Png)
        
        $img.Dispose()
        $bmp.Dispose()
        $graph.Dispose()
        Write-Host "Successfully shrunk $($file.Name) to $newName"
    } catch {
        Write-Host "Error processing $($file.Name): $($_.Exception.Message)"
    }
}
