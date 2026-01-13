import type { Metadata } from 'next';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Política de Reembolso | SOFIA',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-black py-10 px-4 text-white">
      <div className="mx-auto w-full max-w-4xl">
        <Card className="border-zinc-800 bg-zinc-950/60">
          <CardHeader>
            <CardTitle className="text-white">POLÍTICA DE REEMBOLSO – PLATAFORMA SOFIA</CardTitle>
            <CardDescription className="text-zinc-400">
              Condições para solicitação e processamento de reembolsos dos serviços.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 text-zinc-200 leading-relaxed [&_strong]:text-primary">
            <p>
              A presente <strong>Política de Reembolso</strong> regula as condições para solicitação e processamento de
              reembolsos dos produtos e serviços oferecidos pela plataforma <strong>SOFIA</strong>, em conformidade com
              o Código de Defesa do Consumidor e as regras internas da plataforma.
            </p>
            <p>Ao contratar qualquer plano da SOFIA, o usuário declara estar ciente e de acordo com esta política.</p>

            <hr className="border-zinc-800" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">1. PRAZO PARA SOLICITAÇÃO</h2>
              <p>
                O usuário poderá solicitar o reembolso <strong>em até 30 (trinta) dias corridos</strong> contados a
                partir da data de confirmação do pagamento.
              </p>
              <p>Solicitações realizadas após esse prazo <strong>não serão elegíveis</strong> para reembolso.</p>
            </section>

            <hr className="border-zinc-800" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">2. FORMA DE SOLICITAÇÃO</h2>
              <p>
                O reembolso <strong>não é automático</strong> e deverá ser solicitado exclusivamente por meio do
                <Link href="/refund" className="text-primary hover:underline"> formulário oficial de solicitação de reembolso</Link> disponibilizado pela plataforma.
              </p>
              <p>O usuário deverá:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Informar o motivo da solicitação</li>
                <li>Fornecer informações verídicas</li>
                <li>Concordar com a análise do uso da conta</li>
              </ul>
              <p>Solicitações feitas por outros canais não serão consideradas.</p>
            </section>

            <hr className="border-zinc-800" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">3. PROCESSO DE ANÁLISE</h2>
              <p>Após o envio do formulário, a solicitação será submetida a <strong>análise interna</strong>, que poderá considerar, entre outros critérios:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Data da compra</li>
                <li>Uso efetivo da plataforma</li>
                <li>Acesso a conteúdos, aulas e ferramentas</li>
                <li>Conformidade com os Termos de Uso</li>
              </ul>
              <p>
                A SOFIA se reserva o direito de <strong>aprovar ou recusar</strong> o pedido de reembolso, de forma
                fundamentada.
              </p>
              <p>O prazo de resposta é de até <strong>X dias úteis</strong>, contados a partir da solicitação.</p>
            </section>

            <hr className="border-zinc-800" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">4. APROVAÇÃO E ESTORNO</h2>
              <p>Em caso de aprovação:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>O reembolso será processado pelo mesmo meio de pagamento utilizado na compra</li>
                <li>O estorno seguirá os prazos da operadora de cartão ou instituição financeira</li>
                <li>O valor reembolsado poderá ser integral ou parcial, conforme o caso</li>
              </ul>
              <p>Após o reembolso:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>O acesso ao plano pago será cancelado</li>
                <li>A conta será automaticamente revertida para o plano gratuito, quando aplicável</li>
              </ul>
            </section>

            <hr className="border-zinc-800" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">5. CASOS NÃO ELEGÍVEIS</h2>
              <p>Não serão elegíveis para reembolso solicitações que envolvam:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Uso indevido ou compartilhamento de conta</li>
                <li>Violação dos Termos de Uso</li>
                <li>Tentativa de fraude</li>
                <li>Solicitações fora do prazo de 30 dias</li>
                <li>Chargeback iniciado sem tentativa prévia de solução pela plataforma</li>
              </ul>
            </section>

            <hr className="border-zinc-800" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">6. CHARGEBACKS</h2>
              <p>
                Caso o usuário opte por abrir um <strong>chargeback</strong> diretamente junto à operadora de pagamento,
                sem seguir o processo previsto nesta política, a SOFIA se reserva o direito de:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Suspender imediatamente o acesso à plataforma</li>
                <li>Utilizar os registros de uso e esta política como base de contestação</li>
              </ul>
            </section>

            <hr className="border-zinc-800" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">7. ALTERAÇÕES DA POLÍTICA</h2>
              <p>A SOFIA poderá alterar esta Política de Reembolso a qualquer momento.</p>
              <p>As alterações passam a valer a partir da data de publicação.</p>
            </section>

            <hr className="border-zinc-800" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">8. LEGISLAÇÃO E FORO</h2>
              <p>
                Esta Política é regida pelas leis da <strong>República Federativa do Brasil</strong>.
              </p>
              <p>
                Fica eleito o foro do domicílio da empresa responsável pela SOFIA para dirimir quaisquer controvérsias.
              </p>
            </section>

            <hr className="border-zinc-800" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">DISPOSIÇÕES FINAIS</h2>
              <p>
                A solicitação de reembolso implica ciência e concordância com todos os termos aqui descritos.
              </p>
              <p>O não exercício de direitos previstos nesta política não constitui renúncia.</p>
            </section>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
