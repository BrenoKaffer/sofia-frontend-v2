-- =====================================================
-- TABELAS PARA SISTEMA DE PAGAMENTOS PAGAR.ME
-- =====================================================

-- 1. TABELA DE TRANSAÇÕES
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  
  -- Dados da Pagar.me
  pagarme_transaction_id text UNIQUE,
  pagarme_subscription_id text,
  pagarme_customer_id text,
  
  -- Dados da transação
  amount integer NOT NULL, -- Valor em centavos
  original_amount integer, -- Valor original antes do desconto
  currency text DEFAULT 'BRL',
  status text NOT NULL, -- paid, pending, refused, canceled, refunded
  payment_method text NOT NULL, -- credit_card, pix, boleto
  
  -- Dados do cartão (se aplicável)
  card_brand text,
  card_last_digits text,
  card_holder_name text,
  
  -- PIX (se aplicável)
  pix_qr_code text,
  pix_qr_code_url text,
  pix_expires_at timestamp with time zone,
  
  -- Cupom de desconto
  coupon_code text,
  discount_amount integer DEFAULT 0,
  discount_type text, -- percentage, fixed
  
  -- Metadados
  gateway_response jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  
  -- Timestamps
  paid_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT transactions_status_check CHECK (status IN ('paid', 'pending', 'refused', 'canceled', 'refunded')),
  CONSTRAINT transactions_payment_method_check CHECK (payment_method IN ('credit_card', 'pix', 'boleto'))
);

-- 2. TABELA DE ASSINATURAS
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  
  -- Dados da Pagar.me
  pagarme_subscription_id text UNIQUE NOT NULL,
  pagarme_plan_id text,
  pagarme_customer_id text,
  
  -- Dados da assinatura
  plan_name text NOT NULL DEFAULT 'Professional',
  amount integer NOT NULL, -- Valor mensal em centavos
  interval text NOT NULL DEFAULT 'month', -- month, year
  interval_count integer NOT NULL DEFAULT 1,
  
  -- Status da assinatura
  status text NOT NULL, -- active, canceled, past_due, unpaid, trialing
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  
  -- Dados do pagamento
  payment_method text NOT NULL,
  card_brand text,
  card_last_digits text,
  
  -- Cupom aplicado
  coupon_code text,
  discount_amount integer DEFAULT 0,
  
  -- Controle
  trial_end timestamp with time zone,
  canceled_at timestamp with time zone,
  cancel_reason text,
  
  -- Metadados
  gateway_response jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT subscriptions_status_check CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing'))
);

-- 3. TABELA DE CUPONS
CREATE TABLE public.coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  
  -- Tipo e valor do desconto
  discount_type text NOT NULL, -- percentage, fixed
  discount_value integer NOT NULL, -- Porcentagem ou valor em centavos
  
  -- Limites de uso
  max_uses integer, -- NULL = ilimitado
  current_uses integer DEFAULT 0,
  max_uses_per_user integer DEFAULT 1,
  
  -- Validade
  is_active boolean DEFAULT true,
  starts_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  
  -- Restrições
  minimum_amount integer, -- Valor mínimo para aplicar o cupom
  applicable_plans text[] DEFAULT ARRAY['Professional'], -- Planos aplicáveis
  
  -- Metadados
  created_by text,
  metadata jsonb DEFAULT '{}',
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT coupons_pkey PRIMARY KEY (id),
  CONSTRAINT coupons_discount_type_check CHECK (discount_type IN ('percentage', 'fixed')),
  CONSTRAINT coupons_discount_value_check CHECK (discount_value > 0)
);

-- 4. TABELA DE USO DE CUPONS
CREATE TABLE public.coupon_usages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL,
  user_id uuid NOT NULL,
  transaction_id uuid,
  subscription_id uuid,
  
  -- Dados do uso
  discount_amount integer NOT NULL,
  original_amount integer NOT NULL,
  final_amount integer NOT NULL,
  
  -- Timestamps
  used_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT coupon_usages_pkey PRIMARY KEY (id),
  CONSTRAINT coupon_usages_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id),
  CONSTRAINT coupon_usages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT coupon_usages_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id),
  CONSTRAINT coupon_usages_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id)
);

-- 5. TABELA DE WEBHOOKS DA PAGAR.ME
CREATE TABLE public.payment_webhooks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  
  -- Dados do webhook
  webhook_id text,
  event_type text NOT NULL, -- transaction.status_changed, subscription.status_changed, etc.
  object_type text NOT NULL, -- transaction, subscription, etc.
  object_id text NOT NULL, -- ID do objeto na Pagar.me
  
  -- Status do processamento
  status text NOT NULL DEFAULT 'pending', -- pending, processed, failed
  attempts integer DEFAULT 0,
  last_attempt_at timestamp with time zone,
  error_message text,
  
  -- Dados recebidos
  payload jsonb NOT NULL,
  headers jsonb DEFAULT '{}',
  
  -- Timestamps
  received_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone,
  
  CONSTRAINT payment_webhooks_pkey PRIMARY KEY (id),
  CONSTRAINT payment_webhooks_status_check CHECK (status IN ('pending', 'processed', 'failed'))
);

-- 6. TABELA DE MÉTODOS DE PAGAMENTO SALVOS (OPCIONAL)
CREATE TABLE public.payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  
  -- Dados da Pagar.me
  pagarme_card_id text UNIQUE,
  pagarme_customer_id text,
  
  -- Dados do cartão
  card_brand text NOT NULL,
  card_last_digits text NOT NULL,
  card_holder_name text NOT NULL,
  card_exp_month integer NOT NULL,
  card_exp_year integer NOT NULL,
  
  -- Controle
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT payment_methods_pkey PRIMARY KEY (id),
  CONSTRAINT payment_methods_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para transactions
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_pagarme_id ON public.transactions(pagarme_transaction_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);

-- Índices para subscriptions
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_pagarme_id ON public.subscriptions(pagarme_subscription_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- Índices para coupons
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_active ON public.coupons(is_active);
CREATE INDEX idx_coupons_expires_at ON public.coupons(expires_at);

-- Índices para webhooks
CREATE INDEX idx_payment_webhooks_status ON public.payment_webhooks(status);
CREATE INDEX idx_payment_webhooks_event_type ON public.payment_webhooks(event_type);
CREATE INDEX idx_payment_webhooks_received_at ON public.payment_webhooks(received_at);

CREATE TABLE public.webhook_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  hash text,
  payload jsonb NOT NULL,
  headers jsonb DEFAULT '{}',
  received_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone,
  CONSTRAINT webhook_events_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_webhook_events_type ON public.webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed ON public.webhook_events(processed_at);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DADOS INICIAIS (CUPONS DE EXEMPLO)
-- =====================================================

INSERT INTO public.coupons (code, description, discount_type, discount_value, max_uses, expires_at) VALUES
('WELCOME10', 'Desconto de boas-vindas - 10%', 'percentage', 10, NULL, '2024-12-31 23:59:59+00'),
('SAVE20', 'Economia especial - 20%', 'percentage', 20, 100, '2024-06-30 23:59:59+00'),
('FIRST50', 'Primeiro mês R$ 50 OFF', 'fixed', 5000, 50, '2024-12-31 23:59:59+00'),
('PREMIUM15', 'Desconto Premium - 15%', 'percentage', 15, NULL, '2024-12-31 23:59:59+00');
