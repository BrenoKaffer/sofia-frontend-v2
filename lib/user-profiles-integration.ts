import { supabase } from '@/lib/supabase';

// Tipos para os dados do formulário de registro
export interface FormRegistrationData {
  userId: string;
  email: string;
  fullName: string;
  cpf: string;
  termsAccepted: boolean;
}

// Tipo para as preferências armazenadas no user_profiles
export interface UserProfilePreferences {
  cpf: string;
  full_name: string;
  email: string;
  registration_source: string;
  email_verified: boolean;
  profile_completed: boolean;
  onboarding_completed: boolean;
  terms_accepted: boolean;
  registration_date: string;
}

/**
 * Insere dados do formulário de registro na tabela user_profiles
 * usando a função SQL insert_user_profile_from_form
 * 
 * @param userData - Dados coletados do formulário de registro
 * @returns Promise com resultado da operação
 */
export async function insertUserProfileFromForm(userData: FormRegistrationData): Promise<void> {
  
  const { data, error } = await supabase.rpc('insert_user_profile_from_form', {
    p_user_id: userData.userId,
    p_email: userData.email,
    p_full_name: userData.fullName,
    p_cpf: userData.cpf,
    p_terms_accepted: userData.termsAccepted
  });

  if (error) {
    console.error('Erro ao inserir user_profile:', error);
    throw new Error(`Falha ao criar perfil do usuário: ${error.message}`);
  }

  return data;
}

/**
 * Atualiza as preferências do usuário na tabela user_profiles
 * 
 * @param userId - UUID do usuário
 * @param preferences - Novas preferências para atualizar
 * @returns Promise com resultado da operação
 */
export async function updateUserProfilePreferences(
  userId: string, 
  preferences: Partial<UserProfilePreferences>
): Promise<void> {
  
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      preferences: preferences,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao atualizar preferências:', error);
    throw new Error(`Falha ao atualizar preferências: ${error.message}`);
  }
}

/**
 * Busca o perfil completo do usuário da tabela user_profiles
 * 
 * @param userId - UUID do usuário
 * @returns Promise com os dados do perfil
 */
export async function getUserProfile(userId: string) {
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Erro ao buscar perfil do usuário:', error);
    throw new Error(`Falha ao buscar perfil: ${error.message}`);
  }

  return data;
}

/**
 * Marca o onboarding como concluído
 * 
 * @param userId - UUID do usuário
 * @returns Promise com resultado da operação
 */
export async function completeOnboarding(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      preferences: {
        onboarding_completed: true
      },
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao completar onboarding:', error);
    throw new Error(`Falha ao completar onboarding: ${error.message}`);
  }
}

// Exemplo de uso no componente de registro:
/*
import { insertUserProfileFromForm } from '@/lib/user-profiles-integration';

// No seu componente de registro:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    // 1. Primeiro, registrar o usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          cpf: formData.cpf
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Falha ao criar usuário');

    // 2. Depois, inserir dados na user_profiles
    await insertUserProfileFromForm({
      userId: authData.user.id,
      email: formData.email,
      fullName: formData.fullName,
      cpf: formData.cpf,
      termsAccepted: formData.termsAccepted
    });

    console.log('Usuário registrado com sucesso!');
    // Redirecionar para dashboard ou página de confirmação
    
  } catch (error) {
    console.error('Erro no registro:', error);
    // Mostrar erro para o usuário
  }
};
*/