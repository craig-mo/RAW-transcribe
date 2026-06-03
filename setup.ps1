# RAW Transcribe — one-time setup
# Generates app icons and creates two desktop shortcuts:
#   "RAW Transcribe"       -> start-app.vbs   (launch server + open browser)
#   "Stop RAW Transcribe"  -> stop-app.vbs    (stop the background server)
# Re-runnable any time (overwrites existing icons/shortcuts).

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$appDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$desktop = [Environment]::GetFolderPath('Desktop')

function New-AppIcon {
    param([string]$Path, [string]$Glyph)  # Glyph: 'record' (red circle) or 'stop' (gray square)

    $size = 256
    $bmp  = New-Object System.Drawing.Bitmap($size, $size)
    $g    = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    # Dark navy background disc
    $bg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 24, 26, 35))
    $g.FillEllipse($bg, 8, 8, 240, 240)

    if ($Glyph -eq 'record') {
        $fg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 229, 57, 53))
        $g.FillEllipse($fg, 76, 76, 104, 104)
    } else {
        $fg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 200, 205, 215))
        $g.FillRectangle($fg, 84, 84, 88, 88)
    }

    $hicon = $bmp.GetHicon()
    $icon  = [System.Drawing.Icon]::FromHandle($hicon)
    $fs    = New-Object System.IO.FileStream($Path, [System.IO.FileMode]::Create)
    $icon.Save($fs)
    $fs.Close()
    $icon.Dispose(); $g.Dispose(); $bmp.Dispose()
}

function New-AppShortcut {
    param([string]$LinkPath, [string]$VbsName, [string]$IconPath, [string]$Description)

    $ws = New-Object -ComObject WScript.Shell
    $sc = $ws.CreateShortcut($LinkPath)
    # Target wscript.exe (not the .vbs directly) so the shortcut can be pinned
    # to the taskbar and uses our custom icon.
    $sc.TargetPath       = "$env:WINDIR\System32\wscript.exe"
    $sc.Arguments        = "`"$appDir\$VbsName`""
    $sc.WorkingDirectory = $appDir
    $sc.IconLocation     = "$IconPath,0"
    $sc.Description       = $Description
    $sc.Save()
}

$recordIco = Join-Path $appDir 'icon.ico'
$stopIco   = Join-Path $appDir 'icon-stop.ico'

New-AppIcon -Path $recordIco -Glyph 'record'
New-AppIcon -Path $stopIco   -Glyph 'stop'

New-AppShortcut -LinkPath (Join-Path $desktop 'RAW Transcribe.lnk') `
                -VbsName 'start-app.vbs' -IconPath $recordIco `
                -Description 'Launch RAW Transcribe'

New-AppShortcut -LinkPath (Join-Path $desktop 'Stop RAW Transcribe.lnk') `
                -VbsName 'stop-app.vbs' -IconPath $stopIco `
                -Description 'Stop the RAW Transcribe background server'

Write-Host "Done."
Write-Host "  Icons:      $recordIco , $stopIco"
Write-Host "  Shortcuts:  $desktop\RAW Transcribe.lnk"
Write-Host "              $desktop\Stop RAW Transcribe.lnk"
Write-Host ""
Write-Host "To pin to the taskbar: right-click 'RAW Transcribe' on your Desktop"
Write-Host "-> (Win11: 'Show more options') -> 'Pin to taskbar'."
