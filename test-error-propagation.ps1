# Teste de Propagacao de Erros e Fallback de IA

Write-Host "=== Teste de Propagacao de Erros e Fallback ===" -ForegroundColor Cyan

# Passo 1: Busca simples (sem erro)
Write-Host "`n[1] Test: Busca normal (sem erro esperado)..." -ForegroundColor Yellow
try {
    $searchResult = Invoke-RestMethod -Uri "http://localhost:3000/api/products/search" -Method Post `
        -Body (@{ query = "Frango" } | ConvertTo-Json) `
        -ContentType "application/json" `
        -Headers @{"x-user-id" = "test-user-123"}
    
    Write-Host "OK - Sucesso!" -ForegroundColor Green
    Write-Host "Produtos: $($searchResult.produtos.Length)" -ForegroundColor Green
    Write-Host "Erro: $($searchResult.error)" -ForegroundColor Yellow
}
catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# Passo 2: Busca com termo que pode nao encontrar nada com IA
Write-Host "`n[2] Test: Busca com termo obscuro (pode usar fallback)..." -ForegroundColor Yellow
try {
    $searchResult = Invoke-RestMethod -Uri "http://localhost:3000/api/products/busca?q=xyz123abc" -Method Get `
        -Headers @{"x-user-id" = "test-user-123"}
    
    Write-Host "OK - Sucesso!" -ForegroundColor Green
    Write-Host "Produtos: $($searchResult.products.Length)" -ForegroundColor Green
    Write-Host "Erro: $($searchResult.error)" -ForegroundColor Yellow
}
catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# Passo 3: Sugestoes com fallback
Write-Host "`n[3] Test: Sugestoes (com fallback automatico)..." -ForegroundColor Yellow
try {
    $allProducts = (Invoke-RestMethod -Uri "http://localhost:3000/api/products/" -Method Get).products
    $prato = $allProducts | Where-Object { $_.categoria -eq 'PRATO_PRINCIPAL' } | Select-Object -First 1
    
    $carrinhoBody = @{
        carrinho = @(
            @{
                produto = $prato
                preco = $prato.preco
                quantidade = 2
            }
        )
    } | ConvertTo-Json -Depth 10

    $suggestResult = Invoke-RestMethod -Uri "http://localhost:3000/api/products/suggest" -Method Post `
        -Body $carrinhoBody -ContentType "application/json" `
        -Headers @{"x-user-id" = "test-user-123"}
    
    Write-Host "OK - Sucesso!" -ForegroundColor Green
    Write-Host "Sugestoes: $($suggestResult.sugestoes.Length)" -ForegroundColor Green
    Write-Host "Erro reportado: $($suggestResult.error)" -ForegroundColor Yellow
}
catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTestes concluidos!" -ForegroundColor Green
