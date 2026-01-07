import React from 'react';
import { 
  AccountStatus, 
  getSelectableStatuses, 
  getStatusConfig,
  isValidStatusTransition 
} from '@/lib/user-status';

interface UserStatusSelectProps {
  currentStatus: AccountStatus | string;
  onStatusChange: (newStatus: AccountStatus) => void;
  disabled?: boolean;
  showTransitionValidation?: boolean;
  className?: string;
}

export function UserStatusSelect({
  currentStatus,
  onStatusChange,
  disabled = false,
  showTransitionValidation = true,
  className = ''
}: UserStatusSelectProps) {
  const selectableStatuses = getSelectableStatuses();
  
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = event.target.value as AccountStatus;
    onStatusChange(newStatus);
  };

  return (
    <div className={`user-status-select ${className}`}>
      <select
        value={currentStatus}
        onChange={handleChange}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {selectableStatuses.map((status) => {
          const config = getStatusConfig(status.value);
          const isValidTransition = !showTransitionValidation || 
            isValidStatusTransition(currentStatus, status.value) ||
            currentStatus === status.value;
          
          return (
            <option
              key={status.value}
              value={status.value}
              disabled={!isValidTransition}
              style={{
                color: isValidTransition ? config.color : '#999',
                opacity: isValidTransition ? 1 : 0.6
              }}
            >
              {status.label}
            </option>
          );
        })}
      </select>
      
      {/* Legenda de cores */}
      <div className="mt-2 text-xs text-gray-600">
        <div className="flex flex-wrap gap-2">
          <span className="text-green-600">✅ Acesso Liberado</span>
          <span className="text-red-600">❌ Acesso Negado</span>
          <span className="text-gray-600">⏸️ Acesso Limitado</span>
          <span className="text-yellow-600">⏳ Pendente</span>
          <span className="text-indigo-600">👑 Administrador</span>
          <span className="text-violet-600">👑 Super Admin</span>
        </div>
      </div>
    </div>
  );
}

// Componente para exibir status atual (read-only)
interface UserStatusBadgeProps {
  status: AccountStatus | string;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function UserStatusBadge({ 
  status, 
  showDescription = false,
  size = 'md' 
}: UserStatusBadgeProps) {
  const config = getStatusConfig(status);
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const colorClasses = {
    green: 'bg-green-100 text-green-800 border-green-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    darkred: 'bg-red-200 text-red-900 border-red-300',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };

  return (
    <div className="user-status-badge">
      <span 
        className={`
          inline-flex items-center rounded-full border font-medium
          ${sizeClasses[size]}
          ${colorClasses[config.color as keyof typeof colorClasses] || colorClasses.gray}
        `}
        title={config.label}
      >
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    </div>
  );
}

// Componente para histórico de mudanças de status
interface StatusChangeHistoryProps {
  changes: Array<{
    id: string;
    old_status: AccountStatus;
    new_status: AccountStatus;
    reason?: string;
    changed_by?: string;
    changed_at: string;
  }>;
}

export function StatusChangeHistory({ changes }: StatusChangeHistoryProps) {
  if (!changes.length) {
    return (
      <div className="text-center py-4 text-gray-500">
        Nenhuma mudança de status registrada
      </div>
    );
  }

  return (
    <div className="status-change-history">
      <h3 className="text-lg font-semibold mb-3">Histórico de Status</h3>
      
      <div className="space-y-3">
        {changes.map((change) => (
          <div 
            key={change.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
          >
            <div className="flex items-center space-x-3">
              <UserStatusBadge status={change.old_status} size="sm" />
              <span className="text-gray-400">→</span>
              <UserStatusBadge status={change.new_status} size="sm" />
            </div>
            
            <div className="text-right text-sm text-gray-600">
              <div>{new Date(change.changed_at).toLocaleString('pt-BR')}</div>
              {change.changed_by && (
                <div className="text-xs">por {change.changed_by}</div>
              )}
              {change.reason && (
                <div className="text-xs italic mt-1">"{change.reason}"</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}