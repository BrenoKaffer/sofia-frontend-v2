// Teste simples para verificar o problema com o logger
console.log('=== TESTE DO LOGGER ===');

// Simular os enums e mapeamentos
const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const LogLevelString = {
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.DEBUG]: 'DEBUG'
};

console.log('LogLevel enum:', LogLevel);
console.log('LogLevelString mapping:', LogLevelString);

console.log('\nTestando mapeamentos:');
console.log('ERROR (0):', LogLevelString[0]);
console.log('WARN (1):', LogLevelString[1]);
console.log('INFO (2):', LogLevelString[2]);
console.log('DEBUG (3):', LogLevelString[3]);

console.log('\nTestando valores válidos:');
const validLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
console.log('Valores válidos na constraint:', validLevels);

console.log('\nVerificando se todos os valores mapeados são válidos:');
Object.values(LogLevelString).forEach(level => {
  const isValid = validLevels.includes(level);
  console.log(`${level}: ${isValid ? 'VÁLIDO' : 'INVÁLIDO'}`);
});

console.log('\nPossível problema: O enum não tem FATAL, mas a constraint espera FATAL');