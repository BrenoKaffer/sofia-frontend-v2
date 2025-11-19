import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Square } from 'lucide-react'
import { useAutomation } from '@/hooks/useAutomation'

interface Props {
  onStopped?: () => void
}

export function EmergencyStop({ onStopped }: Props) {
  const { emergencyStop, loading } = useAutomation()
  const [confirming, setConfirming] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  async function handleStop() {
    setFeedback(null)
    const res = await emergencyStop()
    if (res.success) {
      setFeedback('Parada de emergência executada com sucesso')
      onStopped?.()
    } else {
      setFeedback(res.error || 'Falha na parada de emergência')
    }
    setConfirming(false)
  }

  return (
    <div className="space-y-3">
      {feedback && (
        <Alert>
          <AlertDescription>{feedback}</AlertDescription>
        </Alert>
      )}
      {!confirming ? (
        <Button variant="destructive" onClick={() => setConfirming(true)} disabled={loading}>
          <AlertTriangle className="mr-2 h-4 w-4" /> Parada de Emergência
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setConfirming(false)} disabled={loading}>Cancelar</Button>
          <Button variant="destructive" onClick={handleStop} disabled={loading}>
            <Square className="mr-2 h-4 w-4" /> Confirmar Parada
          </Button>
        </div>
      )}
    </div>
  )
}