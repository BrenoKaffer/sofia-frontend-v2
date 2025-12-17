# Script para testar se o problema de registro foi resolvido
# Execute este script APOS aplicar os arquivos SQL no Supabase

Write-Host "Testando solucao de registro..." -ForegroundColor Yellow
Write-Host ""

try {
    # Testar endpoint de diagnostico
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/test-registration" -Method GET
    
    Write-Host "Resultados do Teste:" -ForegroundColor Cyan
    Write-Host "Timestamp: $($response.timestamp)" -ForegroundColor Gray
    Write-Host "Tipo de Teste: $($response.testType)" -ForegroundColor Gray
    Write-Host "Problema Resolvido: $($response.problemSolved)" -ForegroundColor $(if($response.problemSolved) { "Green" } else { "Red" })
    Write-Host ""
    
    Write-Host "Resumo dos Testes:" -ForegroundColor Cyan
    Write-Host "Total: $($response.summary.total)" -ForegroundColor Gray
    Write-Host "Passou: $($response.summary.passed)" -ForegroundColor Green
    Write-Host "Falhou: $($response.summary.failed)" -ForegroundColor Red
    Write-Host "Avisos: $($response.summary.warning)" -ForegroundColor Yellow
    Write-Host "Info: $($response.summary.info)" -ForegroundColor Blue
    Write-Host ""
    
    if ($response.problemSolved) {
        Write-Host "SUCESSO! O problema de registro foi resolvido!" -ForegroundColor Green
        Write-Host "Agora voce pode testar o registro real na aplicacao." -ForegroundColor Green
    } else {
        Write-Host "O problema ainda persiste." -ForegroundColor Red
        Write-Host "Proxima acao: $($response.nextAction)" -ForegroundColor Yellow
        
        Write-Host ""
        Write-Host "Arquivos de Solucao Disponiveis:" -ForegroundColor Cyan
        foreach ($file in $response.solutionFiles) {
            Write-Host "- $($file.name) - $($file.purpose)" -ForegroundColor Gray
            Write-Host "  Prioridade: $($file.priority)" -ForegroundColor Yellow
        }
    }
    
} catch {
    Write-Host "Erro ao testar: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Verifique se o servidor esta rodando em http://localhost:3000" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Para executar este teste novamente:" -ForegroundColor Cyan
Write-Host ".\test_registration_fix.ps1" -ForegroundColor Gray