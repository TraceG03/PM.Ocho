# Script to initialize git repository and push to GitHub
# Run this after git is installed

$repoUrl = "https://github.com/TraceG03/PM.Ocho.git"

Write-Host "Checking for git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "Found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Git is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Git from https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "Or run: winget install --id Git.Git -e --source winget" -ForegroundColor Yellow
    exit 1
}

Write-Host "`nInitializing git repository..." -ForegroundColor Yellow
if (Test-Path .git) {
    Write-Host "Git repository already initialized" -ForegroundColor Green
} else {
    git init
    Write-Host "Repository initialized" -ForegroundColor Green
}

Write-Host "`nChecking remote..." -ForegroundColor Yellow
$remote = git remote get-url origin 2>$null
if ($remote) {
    if ($remote -ne $repoUrl) {
        Write-Host "Updating remote URL..." -ForegroundColor Yellow
        git remote set-url origin $repoUrl
    } else {
        Write-Host "Remote already configured: $repoUrl" -ForegroundColor Green
    }
} else {
    Write-Host "Adding remote..." -ForegroundColor Yellow
    git remote add origin $repoUrl
    Write-Host "Remote added: $repoUrl" -ForegroundColor Green
}

Write-Host "`nAdding all files..." -ForegroundColor Yellow
git add .

Write-Host "`nChecking for existing commits..." -ForegroundColor Yellow
$commitCount = (git rev-list --count HEAD 2>$null)
if ([string]::IsNullOrEmpty($commitCount) -or $commitCount -eq "0") {
    Write-Host "Creating initial commit..." -ForegroundColor Yellow
    git commit -m "Initial commit"
} else {
    Write-Host "Repository already has commits" -ForegroundColor Green
    Write-Host "Current branch: $(git branch --show-current)" -ForegroundColor Cyan
}

Write-Host "`nPushing to GitHub..." -ForegroundColor Yellow
Write-Host "Note: You may be prompted for credentials" -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSuccessfully pushed to GitHub!" -ForegroundColor Green
} else {
    Write-Host "`nPush failed. Trying 'master' branch instead..." -ForegroundColor Yellow
    git push -u origin master
}






