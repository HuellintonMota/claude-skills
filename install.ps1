# Instala as claude-skills pelo PowerShell (Windows).
#
#   irm https://raw.githubusercontent.com/HuellintonMota/claude-skills/main/install.ps1 | iex
#
# Ou, com opções, de um clone ou do arquivo baixado:
#   powershell -ExecutionPolicy Bypass -File install.ps1 [-Todas] [-Skills a,b] [-Sim]
#              [-AutoAtualizar] [-SemAutoAtualizar] [-Destino C:\caminho]
#
# Clona (ou atualiza) o repositório e roda o setup com o bash do Git for Windows: o setup e os
# dependencias.sh das skills são bash, e o Claude Code no Windows já depende do Git Bash.
#
# As mensagens deste arquivo ficam sem acento de propósito: o PowerShell 5.1 lê .ps1 sem BOM como
# ANSI, e com BOM o `irm | iex` quebra no primeiro comando.

function Install-ClaudeSkills {
    param(
        [switch]$Todas,
        [string]$Skills,
        [switch]$Sim,
        [switch]$AutoAtualizar,
        [switch]$SemAutoAtualizar,
        [string]$Destino = (Join-Path $HOME '.claude\claude-skills')
    )
    $ErrorActionPreference = 'Stop'
    $repositorio = 'https://github.com/HuellintonMota/claude-skills.git'

    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
            throw 'Falta o Git for Windows. Instale em https://git-scm.com/download/win e rode de novo.'
        }
        $resposta = if ($Sim) { 's' } else { Read-Host 'Falta o Git for Windows. Instalar agora com winget? [S/n]' }
        if ($resposta -match '^(n|nao)$') { throw 'Sem o Git nao da para instalar as skills.' }
        winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements
        $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
    }

    if (Test-Path (Join-Path $Destino '.git')) {
        Write-Host "Atualizando $Destino"
        git -C $Destino pull --ff-only
    } else {
        Write-Host "Clonando em $Destino"
        git clone $repositorio $Destino
    }
    if ($LASTEXITCODE -ne 0) { throw "O git terminou com erro ($LASTEXITCODE)." }

    # O bash.exe que vem com o Git for Windows fica em <Git>\bin, dois niveis acima de git.exe (cmd\git.exe).
    $gitExe = (Get-Command git).Source
    $bash = @(
        (Join-Path (Split-Path (Split-Path $gitExe)) 'bin\bash.exe'),
        (Join-Path $env:ProgramFiles 'Git\bin\bash.exe')
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1
    if (-not $bash) { throw 'Falta o bash do Git for Windows (Git\bin\bash.exe).' }

    $opcoes = @()
    if ($Todas) { $opcoes += '--todas' }
    if ($Skills) { $opcoes += @('--skills', $Skills) }
    if ($Sim) { $opcoes += '--sim' }
    if ($AutoAtualizar) { $opcoes += '--auto-atualizar' }
    if ($SemAutoAtualizar) { $opcoes += '--sem-auto-atualizar' }

    & $bash (Join-Path $Destino 'setup') @opcoes
    if ($LASTEXITCODE -ne 0) { throw "O setup terminou com erro ($LASTEXITCODE)." }
}

Install-ClaudeSkills @args
