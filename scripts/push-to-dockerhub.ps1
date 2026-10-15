param(
  [Parameter(Mandatory=$true)][string]$Username,
  [string]$Tag = "latest"
)

$services = @(
  @{ name = "api-gateway"; path = "api-gateway" },
  @{ name = "auth-service"; path = "auth-service" },
  @{ name = "product-service"; path = "product-service" },
  @{ name = "order-service"; path = "order-service" },
  @{ name = "payment-service"; path = "payment-service" },
  @{ name = "notification-service"; path = "notification-service" },
  @{ name = "frontend"; path = "frontend" }
)

function Run-Command($cmd) {
  Write-Host "$cmd"
  $proc = Start-Process -FilePath "powershell" -ArgumentList "-NoProfile -Command $cmd" -NoNewWindow -Wait -PassThru
  if ($proc.ExitCode -ne 0) { throw "Command failed: $cmd" }
}

# Ensure docker is available
try {
  docker version > $null
} catch {
  Write-Error "Docker does not appear to be available. Start Docker Desktop and ensure 'docker' is on PATH."
  exit 1
}

Write-Host "Make sure you're logged in to Docker Hub (docker login) or Docker Desktop is signed in."

foreach ($svc in $services) {
  $name = $svc.name
  $path = $svc.path

  if (-not (Test-Path $path)) {
    Write-Warning "Path '$path' not found — skipping $name"
    continue
  }

  $fullTag = "$Username/$name:$Tag"
  Write-Host "\n=== Building $name from '$path' -> $fullTag ==="

  $buildCmd = "docker build -t $fullTag `"$path`""
  Run-Command $buildCmd

  Write-Host "Pushing $fullTag"
  $pushCmd = "docker push $fullTag"
  Run-Command $pushCmd
}

Write-Host "All done."