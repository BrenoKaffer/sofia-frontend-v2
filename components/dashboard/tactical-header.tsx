'use client'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Clock, Brain, Target, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'

interface TacticalHeaderProps {
  activeStrategy: string
  targetRoulette: string
  countdown: number
  collectionStatus: 'active' | 'paused' | 'analyzing'
  isPatternActive: boolean
}

export function TacticalHeader({
  activeStrategy,
  targetRoulette,
  countdown,
  collectionStatus,
  isPatternActive
}: TacticalHeaderProps) {
  const [timeLeft, setTimeLeft] = useState(countdown)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    setTimeLeft(countdown)
    setProgress(100)
  }, [countdown, timeLeft])

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0) return 0
          const newTime = prev - 1
          setProgress((newTime / countdown) * 100)
          return newTime
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [countdown])

  const getStatusColor = () => {
    switch (collectionStatus) {
      case 'active': return 'bg-green-500'
      case 'paused': return 'bg-yellow-500'
      case 'analyzing': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = () => {
    switch (collectionStatus) {
      case 'active': return 'Ativo'
      case 'paused': return 'Pausado'
      case 'analyzing': return 'Em Análise'
      default: return 'Desconhecido'
    }
  }

  return (
    <Card className="fixed top-0 left-0 right-0 z-50 rounded-none border-b-2 border-purple-500/20 bg-gradient-to-r from-gray-900 via-purple-900/20 to-gray-900 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Status do Padrão */}
          <div className="flex items-center space-x-4">
            {isPatternActive ? (
              <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold px-4 py-2 text-sm animate-pulse">
                🔥 Padrão Ativo!
              </Badge>
            ) : (
              <Badge className="bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold px-4 py-2 text-sm">
                ⏳ Aguardando Gatilho
              </Badge>
            )}
          </div>

          {/* Informações Centrais */}
          <div className="flex items-center space-x-6 text-sm">
            {/* Estratégia Ativa */}
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-purple-400" />
              <span className="text-white font-medium">{activeStrategy || 'Nenhuma estratégia ativa'}</span>
            </div>

            {/* Roleta de Referência */}
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-green-400" />
              <span className="text-gray-300">{targetRoulette || 'Aguardando conexão'}</span>
            </div>

            {/* Status da Coleta */}
            <div className="flex items-center space-x-2">
              <RotateCcw className="h-4 w-4 text-blue-400" />
              <span className="text-gray-300">Status:</span>
              <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`}></div>
              <span className="text-white font-medium">{getStatusText()}</span>
            </div>
          </div>

          {/* Contador Regressivo */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-400" />
              <span className="text-white font-mono text-lg font-bold">
                {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:
                {(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="w-20">
              <Progress 
                value={progress} 
                className="h-2 bg-gray-700"
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}