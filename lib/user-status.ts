// =====================================================
// UTILITÁRIOS PARA STATUS DE USUÁRIO
// =====================================================

/**
 * Enum TypeScript que espelha o ENUM do PostgreSQL
 */
export enum AccountStatus {
  ACTIVE = 'active',      // ✅ Usuário ativo (acesso liberado)
  FREE = 'free',          // ✅ Usuário gratuito (acesso liberado)
  PREMIUM = 'premium',    // ✅ Usuário premium (acesso liberado)
  TRIAL = 'trial',        // ✅ Usuário em período de teste (acesso liberado)
  BLOCKED = 'blocked',    // ❌ Usuário bloqueado (acesso negado)
  SUSPENDED = 'suspended', // ❌ Usuário suspenso (acesso negado)
  BANNED = 'banned',      // ❌ Usuário banido (acesso negado)
  INACTIVE = 'inactive',  // ⏸️ Usuário inativo (acesso limitado)
  PENDING = 'pending',    // ⏳ Usuário pendente de verificação
  ADMIN = 'admin',        // 👑 Administrador (acesso completo)
  SUPERADMIN = 'superadmin' // 👑 Super administrador (acesso total)
}

/**
 * Type para status de usuário
 */
export type UserAccountStatus = keyof typeof AccountStatus | AccountStatus;

/**
 * Type literal para status de conta
 */
export type AccountStatusType = 
  | 'active'
  | 'free'
  | 'premium'
  | 'trial'
  | 'blocked'
  | 'suspended'
  | 'banned'
  | 'inactive'
  | 'pending'
  | 'admin'
  | 'superadmin';

/**
 * Status que permitem acesso completo à plataforma
 */
export const ALLOWED_STATUSES: AccountStatus[] = [
  AccountStatus.ACTIVE,
  AccountStatus.FREE,
  AccountStatus.PREMIUM,
  AccountStatus.TRIAL,
  AccountStatus.ADMIN,
  AccountStatus.SUPERADMIN
];

/**
 * Status que bloqueiam o acesso à plataforma
 */
export const BLOCKED_STATUSES: AccountStatus[] = [
  AccountStatus.BLOCKED,
  AccountStatus.SUSPENDED,
  AccountStatus.BANNED
];

/**
 * Status que indicam usuário premium
 */
export const PREMIUM_STATUSES: AccountStatus[] = [
  AccountStatus.PREMIUM,
  AccountStatus.TRIAL
];

/**
 * Status que indicam usuário administrador
 */
export const ADMIN_STATUSES: AccountStatus[] = [
  AccountStatus.ADMIN,
  AccountStatus.SUPERADMIN
];

/**
 * Status que permitem acesso limitado
 */
export const LIMITED_STATUSES: AccountStatus[] = [
  AccountStatus.INACTIVE,
  AccountStatus.PENDING
];

/**
 * Configuração de cada status com metadados
 */
export const STATUS_CONFIG = {
  [AccountStatus.ACTIVE]: {
    label: 'Ativo',
    description: 'Usuário ativo com acesso completo',
    color: 'green',
    icon: '✅',
    allowAccess: true,
    isPremium: false,
    priority: 1
  },
  [AccountStatus.FREE]: {
    label: 'Gratuito',
    description: 'Usuário gratuito com acesso básico',
    color: 'blue',
    icon: '✅',
    allowAccess: true,
    isPremium: false,
    priority: 2
  },
  [AccountStatus.PREMIUM]: {
    label: 'Premium',
    description: 'Usuário premium com acesso completo',
    color: 'gold',
    icon: '✅',
    allowAccess: true,
    isPremium: true,
    priority: 0
  },
  [AccountStatus.TRIAL]: {
    label: 'Teste',
    description: 'Usuário em período de teste premium',
    color: 'purple',
    icon: '✅',
    allowAccess: true,
    isPremium: true,
    priority: 1
  },
  [AccountStatus.BLOCKED]: {
    label: 'Bloqueado',
    description: 'Usuário bloqueado temporariamente',
    color: 'red',
    icon: '❌',
    allowAccess: false,
    isPremium: false,
    priority: 10
  },
  [AccountStatus.SUSPENDED]: {
    label: 'Suspenso',
    description: 'Usuário suspenso por violação',
    color: 'orange',
    icon: '❌',
    allowAccess: false,
    isPremium: false,
    priority: 11
  },
  [AccountStatus.BANNED]: {
    label: 'Banido',
    description: 'Usuário banido permanentemente',
    color: 'darkred',
    icon: '❌',
    allowAccess: false,
    isPremium: false,
    priority: 12
  },
  [AccountStatus.INACTIVE]: {
    label: 'Inativo',
    description: 'Usuário inativo com acesso limitado',
    color: 'gray',
    icon: '⏸️',
    allowAccess: false,
    isPremium: false,
    priority: 5
  },
  [AccountStatus.PENDING]: {
    label: 'Pendente',
    description: 'Usuário pendente de verificação',
    color: 'yellow',
    icon: '⏳',
    allowAccess: false,
    isPremium: false,
    priority: 3
  },
  [AccountStatus.ADMIN]: {
    label: 'Administrador',
    description: 'Administrador com acesso completo ao sistema',
    color: 'indigo',
    icon: '👑',
    allowAccess: true,
    isPremium: true,
    isAdmin: true,
    priority: -1
  },
  [AccountStatus.SUPERADMIN]: {
    label: 'Super Admin',
    description: 'Super administrador com acesso total',
    color: 'violet',
    icon: '👑',
    allowAccess: true,
    isPremium: true,
    isAdmin: true,
    isSuperAdmin: true,
    priority: -2
  }
} as const;

/**
 * Verifica se o usuário tem acesso liberado à plataforma
 */
export function userHasAccess(status: AccountStatus | string): boolean {
  return ALLOWED_STATUSES.includes(status as AccountStatus);
}

/**
 * Verifica se o usuário está bloqueado
 */
export function userIsBlocked(status: AccountStatus | string): boolean {
  return BLOCKED_STATUSES.includes(status as AccountStatus);
}

/**
 * Verifica se o usuário é premium
 */
export function userIsPremium(status: AccountStatus | string): boolean {
  return PREMIUM_STATUSES.includes(status as AccountStatus);
}

/**
 * Verifica se o usuário tem acesso limitado
 */
export function userHasLimitedAccess(status: AccountStatus | string): boolean {
  return LIMITED_STATUSES.includes(status as AccountStatus);
}

/**
 * Verifica se o usuário é administrador
 */
export function userIsAdmin(status: AccountStatus | string): boolean {
  return ADMIN_STATUSES.includes(status as AccountStatus);
}

/**
 * Verifica se o usuário é super administrador
 */
export function userIsSuperAdmin(status: AccountStatus | string): boolean {
  return status === AccountStatus.SUPERADMIN;
}

/**
 * Obtém a configuração de um status
 */
export function getStatusConfig(status: AccountStatus | string) {
  return STATUS_CONFIG[status as AccountStatus] || STATUS_CONFIG[AccountStatus.FREE];
}

/**
 * Obtém o label de um status
 */
export function getStatusLabel(status: AccountStatus | string): string {
  return getStatusConfig(status).label;
}

/**
 * Obtém a cor de um status
 */
export function getStatusColor(status: AccountStatus | string): string {
  return getStatusConfig(status).color;
}

/**
 * Obtém o ícone de um status
 */
export function getStatusIcon(status: AccountStatus | string): string {
  return getStatusConfig(status).icon;
}

/**
 * Valida se um status é válido
 */
export function isValidStatus(status: string): status is AccountStatus {
  return Object.values(AccountStatus).includes(status as AccountStatus);
}

/**
 * Converte string para AccountStatus com validação
 */
export function parseAccountStatus(status: string): AccountStatus {
  if (isValidStatus(status)) {
    return status;
  }
  return AccountStatus.FREE; // Default
}

/**
 * Obtém todos os status disponíveis ordenados por prioridade
 */
export function getAllStatuses(): Array<{
  value: AccountStatus;
  label: string;
  description: string;
  color: string;
  icon: string;
  allowAccess: boolean;
  isPremium: boolean;
}> {
  return Object.entries(STATUS_CONFIG)
    .map(([value, config]) => ({
      value: value as AccountStatus,
      ...config
    }))
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Obtém status permitidos para seleção em formulários
 */
export function getSelectableStatuses() {
  return getAllStatuses().map(status => ({
    value: status.value,
    label: `${status.icon} ${status.label}`,
    description: status.description,
    disabled: false
  }));
}

/**
 * Verifica se uma transição de status é válida
 */
export function isValidStatusTransition(
  fromStatus: AccountStatus | string,
  toStatus: AccountStatus | string
): boolean {
  const from = fromStatus as AccountStatus;
  const to = toStatus as AccountStatus;

  // Regras de transição
  const transitions: Record<AccountStatus, AccountStatus[]> = {
    [AccountStatus.PENDING]: [AccountStatus.ACTIVE, AccountStatus.FREE, AccountStatus.BLOCKED],
    [AccountStatus.FREE]: [AccountStatus.PREMIUM, AccountStatus.ACTIVE, AccountStatus.BLOCKED, AccountStatus.SUSPENDED, AccountStatus.INACTIVE],
    [AccountStatus.ACTIVE]: [AccountStatus.PREMIUM, AccountStatus.FREE, AccountStatus.BLOCKED, AccountStatus.SUSPENDED, AccountStatus.INACTIVE],
    [AccountStatus.PREMIUM]: [AccountStatus.FREE, AccountStatus.ACTIVE, AccountStatus.BLOCKED, AccountStatus.SUSPENDED, AccountStatus.INACTIVE],
    [AccountStatus.TRIAL]: [AccountStatus.PREMIUM, AccountStatus.FREE, AccountStatus.ACTIVE, AccountStatus.BLOCKED, AccountStatus.SUSPENDED],
    [AccountStatus.BLOCKED]: [AccountStatus.ACTIVE, AccountStatus.FREE, AccountStatus.SUSPENDED, AccountStatus.BANNED],
    [AccountStatus.SUSPENDED]: [AccountStatus.ACTIVE, AccountStatus.FREE, AccountStatus.BLOCKED, AccountStatus.BANNED],
    [AccountStatus.INACTIVE]: [AccountStatus.ACTIVE, AccountStatus.FREE, AccountStatus.BLOCKED],
    [AccountStatus.BANNED]: [], // Banimento é permanente
    [AccountStatus.ADMIN]: [AccountStatus.ACTIVE, AccountStatus.FREE, AccountStatus.PREMIUM, AccountStatus.BLOCKED, AccountStatus.SUSPENDED, AccountStatus.SUPERADMIN],
    [AccountStatus.SUPERADMIN]: [AccountStatus.ADMIN, AccountStatus.ACTIVE, AccountStatus.FREE, AccountStatus.PREMIUM, AccountStatus.BLOCKED, AccountStatus.SUSPENDED, AccountStatus.BANNED]
  };

  return transitions[from]?.includes(to) || false;
}

/**
 * Interface para mudança de status com auditoria
 */
export interface StatusChangeRequest {
  userId: string;
  newStatus: AccountStatus;
  reason?: string;
  changedBy?: string;
  metadata?: Record<string, any>;
}

/**
 * Valida uma solicitação de mudança de status
 */
export function validateStatusChange(
  currentStatus: AccountStatus | string,
  request: StatusChangeRequest
): { valid: boolean; error?: string } {
  if (!isValidStatus(request.newStatus)) {
    return { valid: false, error: 'Status inválido' };
  }

  if (!isValidStatusTransition(currentStatus, request.newStatus)) {
    return { 
      valid: false, 
      error: `Transição de ${getStatusLabel(currentStatus)} para ${getStatusLabel(request.newStatus)} não é permitida` 
    };
  }

  if (request.newStatus === AccountStatus.BANNED && !request.reason) {
    return { valid: false, error: 'Motivo é obrigatório para banimento' };
  }

  return { valid: true };
}