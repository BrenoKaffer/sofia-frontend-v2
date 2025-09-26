// Função para inserir dados do usuário nas tabelas após o registro
// Este arquivo contém a lógica para salvar os dados do formulário de cadastro

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/auth-helpers-nextjs';

export interface RegistrationData {
  fullName: string;
  cpf: string;
  email: string;
  userId: string;
}

export interface UserProfileData {
  cpf: string;
  registrationSource: string;
  emailVerified: boolean;
  profileCompleted: boolean;
  onboardingCompleted: boolean;
}

/**
 * Insere os dados do usuário nas tabelas após o registro bem-sucedido
 * @param userData - Dados coletados do formulário de registro
 * @returns Promise com resultado da operação
 */
export async function insertUserData(userData: RegistrationData): Promise<void> {
  const supabase = createClientComponentClient();
  
  console.log('🔄 [USER_REGISTRATION] Iniciando inserção de dados do usuário');
  console.log('📋 [USER_REGISTRATION] Dados recebidos:', {
    userId: userData.userId,
    fullName: userData.fullName,
    cpf: userData.cpf ? `${userData.cpf.substring(0, 3)}.***.***.${userData.cpf.substring(-2)}` : 'N/A',
    email: userData.email
  });
  
  try {
    console.log('🔧 [USER_REGISTRATION] Chamando função SQL: insert_user_profile_on_registration');
    console.log('📤 [USER_REGISTRATION] Parâmetros da função:', {
      p_user_id: userData.userId,
      p_full_name: userData.fullName,
      p_cpf: userData.cpf,
      p_email: userData.email
    });
    
    // Usar função SQL que bypassa RLS
    const { data: rpcResult, error: profileError } = await supabase.rpc('insert_user_profile_on_registration', {
      p_user_id: userData.userId,
      p_full_name: userData.fullName,
      p_cpf: userData.cpf,
      p_email: userData.email
    });

    console.log('📥 [USER_REGISTRATION] Resultado da função SQL:', rpcResult);

    if (profileError) {
      console.error('❌ [USER_REGISTRATION] Erro detalhado da função SQL:', {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code
      });
      
      // Log adicional para diferentes tipos de erro
      if (profileError.code === '42883') {
        console.error('🚨 [USER_REGISTRATION] ERRO: Função insert_user_profile_on_registration não existe no banco de dados!');
      } else if (profileError.code === '42P01') {
        console.error('🚨 [USER_REGISTRATION] ERRO: Tabela não encontrada!');
      } else if (profileError.code === '23505') {
        console.error('🚨 [USER_REGISTRATION] ERRO: Violação de chave única (usuário já existe)!');
      }
      
      throw new Error(`Falha ao criar perfil do usuário: ${profileError.message} (Código: ${profileError.code})`);
    }

    console.log('✅ [USER_REGISTRATION] Dados do usuário inseridos com sucesso!');
  } catch (error) {
    console.error('💥 [USER_REGISTRATION] Erro geral ao inserir dados:', {
      error: error,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : 'Stack não disponível'
    });
    throw error;
  }
}

/**
 * Atualiza os dados do perfil do usuário
 * @param userId - ID do usuário
 * @param updates - Dados para atualizar
 * @returns Promise com resultado da operação
 */
export async function updateUserProfile(
  userId: string, 
  updates: Partial<{
    fullName: string;
    avatarUrl: string;
    phone: string;
    birthDate: string;
    preferences: Record<string, any>;
  }>
) {
  const supabase = createClientComponentClient();
  
  try {
    // Atualizar tabela user_profiles unificada
    const profileUpdates: any = {
      updated_at: new Date().toISOString()
    };
    
    if (updates.fullName) profileUpdates.full_name = updates.fullName;
    if (updates.avatarUrl) profileUpdates.avatar_url = updates.avatarUrl;
    if (updates.phone) profileUpdates.phone = updates.phone;
    if (updates.birthDate) profileUpdates.birth_date = updates.birthDate;
    // Atualizar preferências se necessário (mesclar com existentes)
    if (updates.preferences) {
      // Primeiro, buscar as preferências atuais
      const { data: currentProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('preferences')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        throw new Error(`Erro ao buscar preferências atuais: ${fetchError.message}`);
      }

      // Mesclar com as novas preferências
      profileUpdates.preferences = {
        ...currentProfile.preferences,
        ...updates.preferences
      };
    }
    
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update(profileUpdates)
      .eq('user_id', userId);

    if (profileError) {
      throw new Error(`Erro ao atualizar perfil: ${profileError.message}`);
    }

    return { success: true, message: 'Perfil atualizado com sucesso' };

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Erro desconhecido ao atualizar perfil'
    };
  }
}

/**
 * Busca os dados completos do usuário
 * @param userId - ID do usuário
 * @returns Promise com os dados do usuário
 */
export async function getUserData(userId: string) {
  const supabase = createClientComponentClient();
  
  try {
    // Buscar dados do perfil unificado
    const { data: userProfile, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (userProfileError) {
      throw new Error(`Erro ao buscar perfil do usuário: ${userProfileError.message}`);
    }

    // Buscar preferências do sistema
    const { data: systemPreferences, error: preferencesError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('id', userId)
      .single();

    if (preferencesError) {
      console.warn('Preferências do sistema não encontradas, usando padrões');
    }

    return {
      success: true,
      data: {
        userProfile,
        systemPreferences: systemPreferences || {
          theme: 'light',
          notifications: true,
          language: 'pt-BR'
        }
      }
    };

  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Erro desconhecido ao buscar dados'
    };
  }
}

/**
 * Exemplo de uso no componente de registro:
 * 
 * ```typescript
 * import { insertUserData } from '@/lib/user-registration';
 * 
 * // Após o registro bem-sucedido no Supabase Auth:
 * if (data.user) {
 *   const result = await insertUserData({
 *     fullName,
 *     cpf,
 *     email,
 *     userId: data.user.id
 *   });
 *   
 *   if (result.success) {
 *     toast.success('Conta criada com sucesso!');
 *     router.push('/login');
 *   } else {
 *     toast.error(result.message);
 *   }
 * }
 * ```
 */