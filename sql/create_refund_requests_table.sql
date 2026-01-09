-- Tabela de Solicitações de Reembolso
CREATE TABLE IF NOT EXISTS public.refund_requests (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id),
    transaction_id uuid REFERENCES public.transactions(id),
    reason text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'refunded')),
    admin_notes text,
    reviewed_by uuid REFERENCES auth.users(id),
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    
    CONSTRAINT refund_requests_pkey PRIMARY KEY (id)
);

-- Habilitar RLS
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
-- 1. Usuários podem criar suas próprias solicitações
CREATE POLICY "Users can create refund requests" ON public.refund_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Usuários podem ver suas próprias solicitações
CREATE POLICY "Users can view their own refund requests" ON public.refund_requests
    FOR SELECT USING (auth.uid() = user_id);
