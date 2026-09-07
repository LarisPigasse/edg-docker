<#
.SYNOPSIS
    Prepara il pacchetto di deploy del backend EDG per il server di produzione.

.DESCRIPTION
    Copia i servizi backend (esclusi node_modules, dist, .git, .env) in una
    cartella temporanea, aggiunge docker-compose.prod.yml e crea un unico
    file zip pronto per il trasferimento via SFTP verso il server.

.NOTES
    Eseguire da PowerShell posizionandosi nella root del progetto
    (D:\Sviluppo\edg-docker) — lo script usa la cartella corrente come base.

    Se in futuro aggiungi un nuovo microservizio al progetto, aggiungilo
    semplicemente all'array $folders qui sotto.

.EXAMPLE
    cd D:\Sviluppo\edg-docker
    .\deploy-package.ps1
#>

$folders = @('auth-service', 'log-service', 'email-service', 'vehicle-service', 'api-gateway', 'postgres')

$projectRoot = Get-Location
$staging = "$env:TEMP\edg-deploy"
$zipPath = "$env:USERPROFILE\Desktop\edg-deploy.zip"

Write-Host ""
Write-Host "== Preparazione pacchetto di deploy EDG ==" -ForegroundColor Cyan
Write-Host "Cartella progetto: $projectRoot"
Write-Host ""

# Verifica di essere nella cartella giusta (controllo di sicurezza minimo)
if (-not (Test-Path (Join-Path $projectRoot 'docker-compose.prod.yml'))) {
    Write-Error "docker-compose.prod.yml non trovato in questa cartella. Esegui lo script dalla root del progetto (D:\Sviluppo\edg-docker)."
    exit 1
}

# Pulizia cartella temporanea da eventuali esecuzioni precedenti
if (Test-Path $staging) {
    Write-Host "Pulizia cartella temporanea precedente..."
    Remove-Item -Recurse -Force $staging
}
New-Item -ItemType Directory -Path $staging | Out-Null

# Copia ogni servizio, escludendo node_modules / dist / .git / .env
foreach ($f in $folders) {
    $source = Join-Path $projectRoot $f
    if (-not (Test-Path $source)) {
        Write-Warning "Cartella non trovata, salto: $f"
        continue
    }
    Write-Host "Copio $f..."
    robocopy $source "$staging\$f" /E /XD node_modules dist .git /XF .env | Out-Null
}

Write-Host "Copio docker-compose.prod.yml..."
Copy-Item (Join-Path $projectRoot 'docker-compose.prod.yml') $staging

# Crea lo zip finale
if (Test-Path $zipPath) {
    Remove-Item $zipPath
}
Compress-Archive -Path "$staging\*" -DestinationPath $zipPath

Write-Host ""
Write-Host "Pacchetto pronto: $zipPath" -ForegroundColor Green
Write-Host "Trasferiscilo via SFTP in /var/www/edg-docker/ sul server." -ForegroundColor Green
Write-Host ""