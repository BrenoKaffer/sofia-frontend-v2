// =====================================================
// UTILITÁRIOS PARA STATUS DE USUÁRIO
// =====================================================

// --- NOVOS ENUMS (Schema v2) ---

export enum UserStatus {
  ACTIVE = 'active',      // Pode logar e usar o sistema
  BLOCKED = 'blocked',    // Bloqueado por fraude/risco
  REFUNDED = 'refunded',  // Pediu reembolso (bloqueado)
  INACTIVE = 'inactive'   // Conta desativada/excluída
}

export enum UserPlan {
  FREE = 'free',
  PRO = 'pro'
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin'
}

// --- LEGACY ENUMS (Mantido para compatibilidade temporária) ---

/**
 * @deprecated Use UserStatus, UserPlan e UserRole separadamente.
 */
export enum AccountStatus {
  ACTIVE = 'active',
  FREE = 'free',
  PREMIUM = 'premium',
  /** @deprecated Use UserStatus.ACTIVE + UserPlan.PRO */
  TRIAL = 'trial',
  BLOCKED = 'blocked',
  /** @deprecated Use AccountStatus.BLOCKED */
  SUSPENDED = 'suspended',
  /** @deprecated Use AccountStatus.BLOCKED */
  BANNED = 'banned',
  INACTIVE = 'inactive',
  /** @deprecated Use UserStatus.INACTIVE or email verification */
  PENDING = 'pending',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
  /** @deprecated Use UserStatus.REFUNDED */
  REFUNDED = 'refunded'
}

export type UserAccountStatus = keyof typeof AccountStatus | AccountStatus;

// --- CONFIGURAÇÃO E METADADOS ---

export const STATUS_CONFIG = {
  // Novos Status
  [UserStatus.ACTIVE]: { label: 'Ativo', color: 'green', icon: '✅', priority: 1 },
  [UserStatus.BLOCKED]: { label: 'Bloqueado', color: 'red', icon: '❌', priority: 10 },
  [UserStatus.REFUNDED]: { label: 'Reembolsado', color: 'orange', icon: '💰', priority: 11 },
  [UserStatus.INACTIVE]: { label: 'Inativo', color: 'gray', icon: '⏸️', priority: 5 },

  // Legado (Mapeado visualmente)
  [AccountStatus.FREE]: { label: 'Gratuito', color: 'blue', icon: '✅', priority: 2 },
  [AccountStatus.PREMIUM]: { label: 'Premium', color: 'gold', icon: '✅', priority: 0 },
  [AccountStatus.TRIAL]: { label: 'Teste (Legacy)', color: 'purple', icon: '✅', priority: 1 },
  [AccountStatus.SUSPENDED]: { label: 'Suspenso (Legacy)', color: 'orange', icon: '❌', priority: 11 },
  [AccountStatus.BANNED]: { label: 'Banido (Legacy)', color: 'darkred', icon: '❌', priority: 12 },
  [AccountStatus.PENDING]: { label: 'Pendente (Legacy)', color: 'yellow', icon: '⏳', priority: 3 },
  [AccountStatus.ADMIN]: { label: 'Admin', color: 'indigo', icon: '👑', priority: -1 },
  [AccountStatus.SUPERADMIN]: { label: 'Super Admin', color: 'violet', icon: '👑', priority: -2 },
} as const;

// --- HELPERS (V2) ---

export function checkUserAccess(status: UserStatus | string): boolean {
  return status === UserStatus.ACTIVE;
}

export function checkUserPro(plan: UserPlan | string): boolean {
  return plan === UserPlan.PRO;
}

export function checkUserAdmin(role: UserRole | string): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPERADMIN;
}

// --- HELPERS (LEGACY - Redirecionam para lógica compatível ou mantêm comportamento) ---

export function userHasAccess(status: AccountStatus | string): boolean {
  // Se for um dos novos status
  if (Object.values(UserStatus).includes(status as UserStatus)) {
    return status === UserStatus.ACTIVE;
  }
  // Lógica antiga
  return ['active', 'free', 'premium', 'trial', 'admin', 'superadmin'].includes(status);
}

export function userIsBlocked(status: AccountStatus | string): boolean {
  if (status === UserStatus.BLOCKED || status === UserStatus.REFUNDED) return true;
  return ['blocked', 'suspended', 'banned'].includes(status);
}

export function userIsPremium(status: AccountStatus | string): boolean {
  // Lógica antiga (Baseada em status misto)
  return ['premium', 'trial', 'admin', 'superadmin'].includes(status);
}

export function userIsAdmin(status: AccountStatus | string): boolean {
  return ['admin', 'superadmin'].includes(status);
}

export function userIsSuperAdmin(status: AccountStatus | string): boolean {
  return status === AccountStatus.SUPERADMIN;
}

// --- UTILS ---

export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG[UserStatus.ACTIVE];
}

export function getStatusLabel(status: string): string {
  return getStatusConfig(status).label;
}

export function getStatusColor(status: string): string {
  return getStatusConfig(status).color;
}

export function getSelectableStatuses() {
  // Retorna apenas os status principais para evitar poluição visual e uso de legados redundantes.
  const EXCLUDED_FROM_SELECTION = [
    AccountStatus.SUSPENDED,
    AccountStatus.BANNED,
    AccountStatus.TRIAL,
    AccountStatus.PENDING,
    AccountStatus.REFUNDED
  ];

  return Object.values(AccountStatus)
    .filter(s => !EXCLUDED_FROM_SELECTION.includes(s))
    .map(s => ({
      value: s,
      ...getStatusConfig(s)
    }));
}

export function isValidStatusTransition(from: string, to: string): boolean {
  // Simplificação: Admin pode tudo, outros restritos.
  // Implementação completa requereria matriz 3D (Status x Plan x Role).
  return true; 
}

export interface StatusChangeRequest {
  userId: string;
  newStatus: AccountStatus;
  reason?: string;
  changedBy?: string;
  metadata?: Record<string, any>;
}

export function validateStatusChange(
  currentStatus: AccountStatus | string,
  request: StatusChangeRequest
): { valid: boolean; error?: string } {
  // Basic validation
  if (!request.newStatus) {
    return { valid: false, error: 'Novo status é obrigatório' };
  }
  return { valid: true };
}

export interface UserAccessProfile {
  status?: UserStatus | string;
  plan?: UserPlan | string;
  role?: UserRole | string;
  account_status?: AccountStatus | string;
}

export function checkUserFullAccess(profile: UserAccessProfile): boolean {
  if (!profile) return false;

  // 1. Check Status
  let isActive = false;
  if (profile.status) {
    isActive = profile.status === UserStatus.ACTIVE;
  } else {
    // Legacy fallback
    const s = profile.account_status as AccountStatus;
    isActive = ![
      AccountStatus.BLOCKED, 
      AccountStatus.SUSPENDED, 
      AccountStatus.BANNED, 
      AccountStatus.INACTIVE,
      AccountStatus.REFUNDED
    ].includes(s);
  }

  if (!isActive) return false;

  // 2. Check Permission (Pro or Admin)
  if (profile.plan === UserPlan.PRO) return true;
  if (profile.role === UserRole.ADMIN || profile.role === UserRole.SUPERADMIN) return true;

  // Legacy Permission
  if (['premium', 'trial', 'admin', 'superadmin'].includes(profile.account_status as string)) {
    return true;
  }

  return false;
}
