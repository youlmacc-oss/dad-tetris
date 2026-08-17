# 현재 세션에 JDK를 넣는다. 사용:  . .\env.ps1
$candidates = @(
    $env:JAVA_HOME,
    "$env:ProgramFiles\Android\Android Studio\jbr",
    "$env:ProgramFiles\Microsoft",
    "$env:ProgramFiles\Eclipse Adoptium",
    "$env:ProgramFiles\Java"
)

function Find-JavacHome {
    foreach ($root in $candidates) {
        if (-not $root) { continue }
        $direct = Join-Path $root "bin\javac.exe"
        if (Test-Path $direct) {
            return $root
        }
        if (Test-Path $root) {
            $found = Get-ChildItem $root -Directory -ErrorAction SilentlyContinue |
                Where-Object { Test-Path (Join-Path $_.FullName "bin\javac.exe") } |
                Select-Object -First 1
            if ($found) {
                return $found.FullName
            }
        }
    }
    $cmd = Get-Command javac -ErrorAction SilentlyContinue
    if ($cmd) {
        return (Split-Path (Split-Path $cmd.Source))
    }
    return $null
}

$homeDir = Find-JavacHome
if (-not $homeDir) {
    Write-Host "JDK 17+ 를 찾지 못했습니다. https://adoptium.net/ 에서 Temurin 17을 설치하세요."
    return
}

$env:JAVA_HOME = $homeDir
$bin = Join-Path $homeDir "bin"
if ($env:PATH -notlike "*$bin*") {
    $env:PATH = "$bin;" + $env:PATH
}
