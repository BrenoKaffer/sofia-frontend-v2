'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface FallbackComponentProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function FallbackComponent({ error, resetErrorBoundary }: FallbackComponentProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Algo deu errado
        </h1>
        <p className="text-gray-600 mb-4">
          {error.message || 'Ocorreu um erro inesperado'}
        </p>
        <Button 
          onClick={resetErrorBoundary}
          className="w-full"
          variant="default"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}