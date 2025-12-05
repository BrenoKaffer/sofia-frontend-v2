'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardLayout } from '@/components/dashboard/layout'
import AffiliateRecipientForm from '@/components/affiliates/AffiliateRecipientForm'

export default function CreateRecipientPage() {
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <Card className="border-0 shadow-2xl bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-heading">Criar recebedor_id na Pagar.me via API</CardTitle>
            <CardDescription className="font-sans">
              Andrê, preencha seus dados bancários para receber automaticamente os 50% da SOFIA.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AffiliateRecipientForm />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
