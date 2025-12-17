@echo off
echo =====================================================
echo APLICANDO POLITICAS RLS NO BANCO DE DADOS
echo =====================================================

echo.
echo Conectando ao banco de dados PostgreSQL...
echo.

REM Definir variáveis de conexão
set PGHOST=localhost
set PGUSER=postgres
set PGDATABASE=sofia

REM Executar o script de aplicação
psql -h %PGHOST% -U %PGUSER% -d %PGDATABASE% -f apply_all_rls.sql

echo.
echo =====================================================
echo APLICACAO CONCLUIDA!
echo =====================================================
echo.
echo Verifique os resultados acima para confirmar que
echo todas as politicas RLS foram aplicadas corretamente.
echo.
echo Se houver erros, verifique:
echo 1. Se o PostgreSQL esta rodando
echo 2. Se as credenciais estao corretas
echo 3. Se o banco 'sofia' existe
echo.
pause