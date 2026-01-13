import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Termos de Uso | SOFIA',
  robots: {
    index: false,
    follow: false,
  },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black py-10 px-4 text-white">
      <div className="mx-auto w-full max-w-4xl">
        <Card className="border-zinc-800 bg-zinc-950/60">
          <CardHeader>
            <CardTitle className="text-white">TERMOS DE USO – PLATAFORMA SOFIA</CardTitle>
            <CardDescription className="text-zinc-400">
              Ao acessar, cadastrar-se ou utilizar a plataforma, você concorda com estes termos.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 text-zinc-200 leading-relaxed [&_strong]:text-emerald-300">
            <p>
              Ao acessar, cadastrar-se ou utilizar a plataforma <strong>SOFIA</strong>, o usuário declara que leu,
              compreendeu e concorda integralmente com os presentes <strong>Termos de Uso</strong>, bem como com as
              demais políticas aplicáveis, incluindo Política de Privacidade, SLA e condições comerciais.
            </p>
            <p>Caso não concorde com qualquer cláusula, o usuário não deverá utilizar a plataforma.</p>

            <hr className="border-zinc-800" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">1. TERMOS GERAIS</h2>
              <p>
                A SOFIA é uma plataforma digital que oferece conteúdos educacionais, metodologias, ferramentas,
                análises, templates e sistemas de apoio à tomada de decisão, incluindo leitura de contexto, gestão e
                controle emocional aplicados a estratégias probabilísticas.
              </p>
              <p>
                A SOFIA <strong>não garante resultados financeiros</strong>, ganhos, lucros ou desempenho específico.
                Toda utilização ocorre <strong>por conta e risco exclusivo do usuário</strong>.
              </p>
              <p>
                O acesso pode ser gratuito ou pago, conforme o plano contratado, estando determinadas funcionalidades
                restritas a usuários PRO.
              </p>
            </section>

            <hr className="border-zinc-800" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">2. SLA – ACORDO DE NÍVEL DE SERVIÇO</h2>
              <p>
                A SOFIA se compromete a envidar seus melhores esforços para manter a plataforma disponível, funcional
                e segura, observando os seguintes parâmetros:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Disponibilidade alvo: <strong>99% ao mês</strong>, exceto em casos de manutenção programada.</li>
                <li>Manutenções poderão ocorrer sem aviso prévio em casos emergenciais.</li>
                <li>
                  A SOFIA não se responsabiliza por indisponibilidades causadas por:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Falhas de internet do usuário</li>
                    <li>Problemas em serviços de terceiros</li>
                    <li>Casos fortuitos ou força maior</li>
                  </ul>
                </li>
              </ul>
              <p>
                Eventuais falhas não geram direito automático a indenização, abatimento ou compensação, salvo previsão
                expressa.
              </p>
            </section>

            <hr className="border-zinc-800" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">3. USO DE LICENÇA</h2>
              <p>
                O usuário recebe uma <strong>licença limitada, não exclusiva, intransferível e revogável</strong> para
                acessar e utilizar a plataforma SOFIA conforme o plano contratado.
              </p>
              <p>É <strong>expressamente proibido</strong>:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Copiar, redistribuir ou revender conteúdos, sistemas ou metodologias</li>
                <li>Compartilhar acesso (login/senha)</li>
                <li>Engenharia reversa, scraping ou automação não autorizada</li>
                <li>Uso comercial não autorizado</li>
              </ul>
              <p>
                A violação desta cláusula poderá resultar em <strong>suspensão ou encerramento imediato da conta</strong>
                , sem reembolso.
              </p>
            </section>

            <hr className="border-zinc-800" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">4. ISENÇÃO DE RESPONSABILIDADE</h2>
              <p>
                A SOFIA <strong>não presta consultoria financeira, jurídica ou de investimentos</strong>.
              </p>
              <p>
                As informações, metodologias, sistemas e análises fornecidas têm caráter{' '}
                <strong>educacional e informativo</strong>, não constituindo promessa de resultado ou recomendação
                individualizada.
              </p>
              <p>O usuário reconhece que:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Estratégias envolvem risco</li>
                <li>Resultados passados não garantem resultados futuros</li>
                <li>Qualquer decisão tomada é de sua exclusiva responsabilidade</li>
              </ul>
              <p>
                A SOFIA não se responsabiliza por perdas financeiras, danos diretos ou indiretos decorrentes do uso da
                plataforma.
              </p>
            </section>

            <hr className="border-zinc-800" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">5. LIMITAÇÕES DE RESPONSABILIDADE</h2>
              <p>Em nenhuma hipótese a SOFIA, seus sócios, colaboradores ou parceiros serão responsáveis por:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Perda de lucros</li>
                <li>Perda de dados</li>
                <li>Interrupção de atividades</li>
                <li>Danos morais ou consequenciais</li>
              </ul>
              <p>
                A responsabilidade total da SOFIA, quando aplicável, estará limitada ao{' '}
                <strong>valor efetivamente pago pelo usuário nos últimos 12 meses</strong>, se houver.
              </p>
            </section>

            <hr className="border-zinc-800" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">6. PRECISÃO DOS MATERIAIS</h2>
              <p>
                Os materiais disponibilizados na plataforma podem conter erros técnicos, tipográficos ou conceituais.
              </p>
              <p>A SOFIA não garante que:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Os conteúdos sejam totalmente atualizados</li>
                <li>Os dados estejam livres de erros</li>
                <li>As metodologias se apliquem a todos os contextos</li>
              </ul>
              <p>
                A SOFIA reserva-se o direito de modificar, atualizar ou remover conteúdos a qualquer momento, sem aviso
                prévio.
              </p>
            </section>

            <hr className="border-zinc-800" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">7. LINKS, MODIFICAÇÕES E LEI APLICÁVEL</h2>

              <h3 className="text-base font-semibold text-white">Links</h3>
              <p>A SOFIA pode conter links para sites de terceiros. Não nos responsabilizamos por:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Conteúdos externos</li>
                <li>Políticas de terceiros</li>
                <li>Práticas de privacidade externas</li>
              </ul>
              <p>O acesso a links externos ocorre por conta e risco do usuário.</p>

              <hr className="border-zinc-800" />

              <h3 className="text-base font-semibold text-white">Modificações</h3>
              <p>
                A SOFIA poderá alterar estes Termos de Uso a qualquer momento. As alterações passam a valer a partir de
                sua publicação.
              </p>
              <p>
                O uso continuado da plataforma após alterações implica <strong>aceite automático</strong>.
              </p>

              <hr className="border-zinc-800" />

              <h3 className="text-base font-semibold text-white">Lei Aplicável</h3>
              <p>Estes Termos são regidos pelas leis da <strong>República Federativa do Brasil</strong>.</p>
              <p>
                Fica eleito o foro da comarca do <strong>domicílio da empresa responsável pela SOFIA</strong>, com
                renúncia expressa a qualquer outro, por mais privilegiado que seja.
              </p>
            </section>

            <hr className="border-zinc-800" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">DISPOSIÇÕES FINAIS</h2>
              <p>
                Caso qualquer cláusula seja considerada inválida ou inexequível, as demais permanecerão em pleno vigor.
              </p>
              <p>O não exercício de qualquer direito não implica renúncia.</p>
            </section>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
