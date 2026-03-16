# Teste das rotas de pedidos

Write-Host "=== Teste de Rotas de Pedidos ===" -ForegroundColor Cyan

# Passo 1: Obter produtos
Write-Host "`n[1] Buscando produtos..." -ForegroundColor Yellow
$products = (Invoke-RestMethod -Uri "http://localhost:3000/api/products/" -Method Get).products
$p1 = $products[0]
$p2 = $products[1]
Write-Host "Produtos obtidos: $($p1.nome), $($p2.nome)" -ForegroundColor Green

# Passo 2: Criar um pedido
Write-Host "`n[2] Criando pedido..." -ForegroundColor Yellow
$carrinhoBody = @{
    produtos = @(
        @{
            produto = $p1
            preco = $p1.preco
            quantidade = 2
        },
        @{
            produto = $p2
            preco = $p2.preco
            quantidade = 1
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $pedido = Invoke-RestMethod -Uri "http://localhost:3000/api/orders/" -Method Post `
        -Body $carrinhoBody -ContentType "application/json" `
        -Headers @{"x-user-id" = "test-user-123"}
    
    $pedidoId = $pedido.order.id
    Write-Host "Pedido criado com ID: $pedidoId" -ForegroundColor Green
    Write-Host "Status: $($pedido.order.status)" -ForegroundColor Green
    Write-Host "Preço total: R$ $($pedido.order.preco_total)" -ForegroundColor Green
}
catch {
    Write-Host "Erro ao criar pedido: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Passo 3: Listar pedidos do usuário
Write-Host "`n[3] Listando pedidos do usuário..." -ForegroundColor Yellow
try {
    $userOrders = Invoke-RestMethod -Uri "http://localhost:3000/api/orders/user" -Method Get `
        -Headers @{"x-user-id" = "test-user-123"}
    
    Write-Host "Total de pedidos: $($userOrders.orders.Length)" -ForegroundColor Green
    Write-Host "Pendentes: $($userOrders.pendentes.Length)" -ForegroundColor Yellow
    Write-Host "Completos: $($userOrders.completos.Length)" -ForegroundColor Green
    Write-Host "Cancelados: $($userOrders.cancelados.Length)" -ForegroundColor Red
}
catch {
    Write-Host "Erro ao listar pedidos: $($_.Exception.Message)" -ForegroundColor Red
}

# Passo 4: Atualizar status do pedido para COMPLETO
Write-Host "`n[4] Atualizando status do pedido para COMPLETO..." -ForegroundColor Yellow
try {
    $statusUpdate = @{ status = "COMPLETO" } | ConvertTo-Json
    $updatedOrder = Invoke-RestMethod -Uri "http://localhost:3000/api/orders/$pedidoId/status" -Method Put `
        -Body $statusUpdate -ContentType "application/json"
    
    Write-Host "Pedido atualizado!" -ForegroundColor Green
    Write-Host "Novo status: $($updatedOrder.order.status)" -ForegroundColor Green
    Write-Host "Completado em: $($updatedOrder.order.completado_em)" -ForegroundColor Green
}
catch {
    Write-Host "Erro ao atualizar status: $($_.Exception.Message)" -ForegroundColor Red
}

# Passo 5: Listar todos os pedidos (admin)
Write-Host "`n[5] Listando todos os pedidos (admin)..." -ForegroundColor Yellow
try {
    $allOrders = Invoke-RestMethod -Uri "http://localhost:3000/api/orders/" -Method Get
    
    Write-Host "Total: $($allOrders.orders.Length)" -ForegroundColor Green
    Write-Host "Pendentes: $($allOrders.pendentes.Length)" -ForegroundColor Yellow
    Write-Host "Completos: $($allOrders.completos.Length)" -ForegroundColor Green
    Write-Host "Cancelados: $($allOrders.cancelados.Length)" -ForegroundColor Red
}
catch {
    Write-Host "Erro ao listar todos os pedidos: $($_.Exception.Message)" -ForegroundColor Red
}

# Passo 6: Verificar um pedido específico
Write-Host "`n[6] Buscando pedido específico..." -ForegroundColor Yellow
try {
    $specificOrder = Invoke-RestMethod -Uri "http://localhost:3000/api/orders/$pedidoId" -Method Get
    
    Write-Host "Pedido encontrado!" -ForegroundColor Green
    Write-Host "ID: $($specificOrder.order.id)" -ForegroundColor Green
    Write-Host "Status: $($specificOrder.order.status)" -ForegroundColor Green
    Write-Host "Produtos: $($specificOrder.order.produtos.Length)" -ForegroundColor Green
}
catch {
    Write-Host "Erro ao buscar pedido: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ Testes concluídos!" -ForegroundColor Green
