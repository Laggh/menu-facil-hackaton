# Teste simples do /suggest endpoint

# Passo 1: Obter lista de produtos
Write-Host "Step 1: Fetching products..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/products/" -Method Get
    $products = $response.products
    Write-Host "Found products" -ForegroundColor Green
    
    # Mostrar um produto como exemplo
    $firstProduct = $products[0]
    Write-Host "`nFirst product structure:" -ForegroundColor Yellow
    $firstProduct | ConvertTo-Json -Depth 10
}
catch {
    Write-Host "Error fetching products: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Passo 2: Preparar carrinho
Write-Host "`nStep 2: Preparing cart..." -ForegroundColor Cyan
$carrinho = @(
    @{
        produto = $products[0];
        preco = $products[0].preco;
        quantidade = 2;
    }
)
Write-Host "Cart prepared with 1 item"

# Passo 3: Enviar para /suggest
Write-Host "`nStep 3: Testing /suggest endpoint..." -ForegroundColor Cyan
$body = @{ carrinho = $carrinho } | ConvertTo-Json -Depth 10
Write-Host "Payload:" -ForegroundColor Yellow
$body

Write-Host "`nSending request..." -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Uri "http://localhost:3000/api/products/suggest" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -Headers @{"x-user-id" = "test-user-123"}
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    $result | ConvertTo-Json -Depth 10
}
catch {
    Write-Host "ERROR!" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)"
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $errorBody = $reader.ReadToEnd()
            Write-Host "Body: $errorBody"
        }
        catch {}
    }
}
