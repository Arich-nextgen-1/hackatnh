Add-Type -AssemblyName System.Drawing

function Create-Icon {
    param (
        [int]$Size,
        [string]$Path,
        [bool]$Maskable = $false
    )
    
    $dir = [System.IO.Path]::GetDirectoryName($Path)
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }

    $bmp = New-Object System.Drawing.Bitmap $Size, $Size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    # Enable high quality rendering
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    
    # Background color: Blue (#2563EB)
    $blueBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 37, 99, 235))
    $whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    
    if ($Maskable) {
        # Full square background
        $g.FillRectangle($blueBrush, 0, 0, $Size, $Size)
        
        # Cross dimensions in safe zone (middle 60%)
        $margin = [int]($Size * 0.28)
        $barWidth = [int]($Size * 0.16)
        
        $center = $Size / 2
        $halfBar = $barWidth / 2
        
        # Draw vertical bar
        $g.FillRectangle($whiteBrush, [int]($center - $halfBar), $margin, $barWidth, [int]($Size - 2 * $margin))
        # Draw horizontal bar
        $g.FillRectangle($whiteBrush, $margin, [int]($center - $halfBar), [int]($Size - 2 * $margin), $barWidth)
    } else {
        # Circular background
        $g.Clear([System.Drawing.Color]::Transparent)
        $g.FillEllipse($blueBrush, 0, 0, $Size, $Size)
        
        # Cross dimensions
        $margin = [int]($Size * 0.22)
        $barWidth = [int]($Size * 0.18)
        
        $center = $Size / 2
        $halfBar = $barWidth / 2
        
        # Draw vertical bar
        $g.FillRectangle($whiteBrush, [int]($center - $halfBar), $margin, $barWidth, [int]($Size - 2 * $margin))
        # Draw horizontal bar
        $g.FillRectangle($whiteBrush, $margin, [int]($center - $halfBar), [int]($Size - 2 * $margin), $barWidth)
    }
    
    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created $Path"
}

# Create icons
Create-Icon -Size 192 -Path "public\icons\icon-192.png"
Create-Icon -Size 512 -Path "public\icons\icon-512.png"
Create-Icon -Size 192 -Path "public\icons\icon-192-maskable.png" -Maskable $true
Create-Icon -Size 512 -Path "public\icons\icon-512-maskable.png" -Maskable $true
Create-Icon -Size 180 -Path "public\icons\apple-touch-icon.png"

# Save favicon.ico (simplified to png icon rename or drawing 32x32)
Create-Icon -Size 32 -Path "public\favicon.png"
if (Test-Path "public\favicon.png") {
    if (Test-Path "public\favicon.ico") { Remove-Item "public\favicon.ico" }
    Rename-Item -Path "public\favicon.png" -NewName "favicon.ico"
    Write-Host "Created public\favicon.ico"
}
