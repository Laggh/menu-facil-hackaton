# Teste do endpoint /suggest

# Obter todos os produtos
Write-Host "Fetching products..." -ForegroundColor Cyan
$allProducts = (Invoke-RestMethod -Uri "http://localhost:3000/api/products/" -Method Get).products

# Selecionar alguns produtos para o carrinho
$prato = $allProducts | Where-Object { $_.categoria -eq 'PRATO_PRINCIPAL' } | Select-Object -First 1
$acompanhamento = $allProducts | Where-Object { $_.categoria -eq 'ACOMPANHAMENTOS' } | Select-Object -First 1
$bebida = $allProducts | Where-Object { $_.categoria -eq 'BEBIDAS' } | Select-Object -First 1

if (!$prato -or !$acompanhamento) {
    Write-Host "Error: Not enough products with required categories" -ForegroundColor Red
    exit 1
}

# Criar o carrinho com PedidoProduto (sem a bebida para testar as sugestões)
$carrinho = @(
    @{
        produto = $prato;
        preco = $prato.preco;
        quantidade = 2;
        observacao = "Sem cebola"
    },
    @{
        produto = $acompanhamento;
        preco = $acompanhamento.preco;
        quantidade = 1;
        observacao = $null
    }
)

Write-Host "Cart contents:" -ForegroundColor Yellow
$carrinho | ForEach-Object {
    Write-Host "  $($_.quantidade)x $($_.produto.nome) ($($_.produto.categoria))"
}

# Enviar para o endpoint /suggest
Write-Host "`nTesting /suggest endpoint..." -ForegroundColor Cyan
$payload = @{ carrinho = $carrinho } | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/products/suggest" `
        -Method Post `
        -Body $payload `
        -ContentType "application/json" `
        -Headers @{"x-user-id" = "test-user-123"}
    
    Write-Host "Success!" -ForegroundColor Green
    Write-Host "Suggestions:" -ForegroundColor Yellow
    if ($response.sugestoes -and $response.sugestoes.Length -gt 0) {
        $response.sugestoes | ForEach-Object {
            Write-Host "  - [$($_.id)] $($_.nome) ($($_.categoria))"
        }
    } else {
        Write-Host "  (no suggestions)"
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.Exception.Response.Content -ForegroundColor Red
}
