Add-Type -AssemblyName System.Drawing
$imagesDir = "c:\Users\saul1\OneDrive\Documentos\CasaSoftware\assets\images"
$files = Get-ChildItem -Path $imagesDir -Filter *.png

# Function to get encoder by mime type
function Get-Encoder($mimeType) {
    return [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq $mimeType }
}

# Encoder parameters for quality
$jpegEncoder = Get-Encoder "image/jpeg"
$quality = 60 # Aggressive compression
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, $quality)

foreach ($file in $files) {
    if ($file.Name -like "*logo*") { continue } # Keep logo as high quality PNG
    try {
        $img = [System.Drawing.Image]::FromFile($file.FullName)
        
        # Ensure we always use a reasonable width for mockups
        $newWidth = 400 
        $newHeight = [int]($img.Height * ($newWidth / $img.Width))
        
        $bmp = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
        $graph = [System.Drawing.Graphics]::FromImage($bmp)
        $graph.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighSpeed
        $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::Low
        $graph.DrawImage($img, 0, 0, $newWidth, $newHeight)
        
        $newName = $file.BaseName.Replace("_small", "") + "_ultra.jpg"
        $newPath = Join-Path $imagesDir $newName
        
        $bmp.Save($newPath, $jpegEncoder, $encoderParams)
        
        $img.Dispose()
        $bmp.Dispose()
        $graph.Dispose()
        Write-Host "Compressed $($file.Name) -> $newName"
    } catch {
        Write-Host "Error processing $($file.Name): $($_.Exception.Message)"
    }
}
