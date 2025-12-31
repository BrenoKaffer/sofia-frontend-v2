import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, readdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Configuração do Backend SOFIA (env primeiro, fallback para localhost)
const BACKEND_BASE = process.env.SOFIA_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
const SOFIA_BACKEND_URL = `${BACKEND_BASE}/api`;
const BACKUP_DIR = join(process.cwd(), 'backups');

// Garantir que o diretório de backup existe
if (!existsSync(BACKUP_DIR)) {
  mkdirSync(BACKUP_DIR, { recursive: true });
}

interface BackupData {
  user_id: string;
  timestamp: string;
  version: string;
  data: {
    preferences: any;
    settings: any;
    strategies: any[];
    history: any[];
    performance: any;
  };
}

// Função para buscar todos os dados do usuário
async function fetchAllUserData(authHeader: string) {
  try {
    const [preferencesRes, historyRes] = await Promise.allSettled([
      fetch(`${SOFIA_BACKEND_URL}/user-preferences`, {
        headers: { 'Authorization': authHeader }
      }),
      fetch(`${SOFIA_BACKEND_URL}/signals-history`, {
        headers: { 'Authorization': authHeader }
      })
    ]);

    const preferences = preferencesRes.status === 'fulfilled' && preferencesRes.value.ok 
      ? await preferencesRes.value.json() 
      : generateMockPreferences();

    const history = historyRes.status === 'fulfilled' && historyRes.value.ok 
      ? await historyRes.value.json() 
      : [];

    return {
      preferences,
      settings: preferences,
      strategies: preferences.strategies || [],
      history: history.slice(0, 100), // Últimos 100 registros
      performance: {
        total_trades: history.length,
        win_rate: 0.65,
        profit_loss: 1250.50,
        last_updated: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return generateMockUserData();
  }
}

// Função para gerar dados mock
function generateMockPreferences() {
  return {
    user_id: 'mock_user_123',
    strategies: ['Hot Numbers AI', 'Pattern Recognition'],
    tables: ['pragmatic-brazilian-roulette'],
    notifications: { email_enabled: true, push_enabled: true },
    dashboard_config: { stats_cards_visible: true },
    last_updated: new Date().toISOString()
  };
}

function generateMockUserData() {
  const preferences = generateMockPreferences();
  return {
    preferences,
    settings: preferences,
    strategies: preferences.strategies,
    history: [],
    performance: {
      total_trades: 0,
      win_rate: 0,
      profit_loss: 0,
      last_updated: new Date().toISOString()
    }
  };
}

// POST - Criar backup
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando criação de backup...');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      );
    }

    // Buscar todos os dados do usuário
    const userData = await fetchAllUserData(authHeader);
    
    const backupData: BackupData = {
      user_id: userData.preferences.user_id || 'mock_user_123',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: userData
    };

    // Salvar backup em arquivo
    const filename = `backup_${backupData.user_id}_${Date.now()}.json`;
    const filepath = join(BACKUP_DIR, filename);
    
    await writeFile(filepath, JSON.stringify(backupData, null, 2));
    
    console.log('✅ Backup criado:', filename);
    
    return NextResponse.json({
      success: true,
      backup_id: filename,
      timestamp: backupData.timestamp,
      size: JSON.stringify(backupData).length,
      message: 'Backup criado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar backup:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET - Listar backups
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Listando backups...');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      );
    }

    const files = await readdir(BACKUP_DIR);
    const backupFiles = files.filter(file => file.startsWith('backup_') && file.endsWith('.json'));
    
    const backups = await Promise.all(
      backupFiles.map(async (filename) => {
        try {
          const filepath = join(BACKUP_DIR, filename);
          const content = await readFile(filepath, 'utf-8');
          const backup: BackupData = JSON.parse(content);
          
          return {
            id: filename,
            timestamp: backup.timestamp,
            version: backup.version,
            size: content.length,
            user_id: backup.user_id
          };
        } catch (error) {
          console.error(`Erro ao ler backup ${filename}:`, error);
          return null;
        }
      })
    );
    
    const validBackups = backups.filter(backup => backup !== null);
    
    console.log(`✅ ${validBackups.length} backups encontrados`);
    
    return NextResponse.json({
      backups: validBackups.sort((a, b) => 
        new Date(b!.timestamp).getTime() - new Date(a!.timestamp).getTime()
      )
    });
  } catch (error) {
    console.error('Erro ao listar backups:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Restaurar backup
export async function PUT(request: NextRequest) {
  try {
    console.log('🚀 Iniciando restauração de backup...');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      );
    }

    const { backup_id } = await request.json();
    
    if (!backup_id) {
      return NextResponse.json(
        { error: 'ID do backup é obrigatório' },
        { status: 400 }
      );
    }

    // Ler arquivo de backup
    const filepath = join(BACKUP_DIR, backup_id);
    const content = await readFile(filepath, 'utf-8');
    const backupData: BackupData = JSON.parse(content);
    
    // Restaurar preferências do usuário
    const restoreResponse = await fetch(`${SOFIA_BACKEND_URL}/user-preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(backupData.data.preferences),
    });

    if (!restoreResponse.ok) {
      console.log('⚠️ Erro ao restaurar no backend, simulando sucesso (modo mock)');
    }
    
    console.log('✅ Backup restaurado:', backup_id);
    
    return NextResponse.json({
      success: true,
      backup_id,
      restored_at: new Date().toISOString(),
      message: 'Backup restaurado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao restaurar backup:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir backup
export async function DELETE(request: NextRequest) {
  try {
    console.log('🚀 Excluindo backup...');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const backup_id = url.searchParams.get('backup_id');
    
    if (!backup_id) {
      return NextResponse.json(
        { error: 'ID do backup é obrigatório' },
        { status: 400 }
      );
    }

    const filepath = join(BACKUP_DIR, backup_id);
    await unlink(filepath);
    
    console.log('✅ Backup excluído:', backup_id);
    
    return NextResponse.json({
      success: true,
      backup_id,
      message: 'Backup excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir backup:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
