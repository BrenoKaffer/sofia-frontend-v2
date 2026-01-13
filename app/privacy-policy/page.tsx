import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Política de Privacidade | SOFIA',
  robots: {
    index: false,
    follow: false,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-black py-10 px-4 text-white">
      <div className="mx-auto w-full max-w-4xl">
        <Card className="border-zinc-800 bg-zinc-950/60">
          <CardHeader>
            <CardTitle className="text-white">POLÍTICA DE PRIVACIDADE – PLATAFORMA SOFIA</CardTitle>
            <CardDescription className="text-zinc-400">
              Como coletamos, utilizamos e protegemos seus dados pessoais.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 text-zinc-200 leading-relaxed [&_strong]:text-primary">
            <p>
              A presente <strong>Política de Privacidade</strong> descreve como a plataforma <strong>SOFIA</strong>{' '}
              coleta, utiliza, armazena, compartilha e protege os dados pessoais dos usuários, em conformidade com a{' '}
              <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD)</strong>.
            </p>
            <p>Ao acessar ou utilizar a plataforma, o usuário declara ciência e concordância com esta Política.</p>

            <hr className="border-zinc-800" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">1. DADOS COLETADOS</h2>
              <p>A SOFIA poderá coletar os seguintes dados pessoais:</p>

              <h3 className="text-base font-semibold text-white">1.1 Dados fornecidos pelo usuário</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Nome completo</li>
                <li>Endereço de e-mail</li>
                <li>CPF</li>
                <li>Senha (armazenada de forma criptografada)</li>
                <li>Dados de cadastro e perfil</li>
                <li>Informações fornecidas em formulários (ex: reembolso, suporte)</li>
              </ul>

              <h3 className="text-base font-semibold text-white">1.2 Dados coletados automaticamente</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Endereço IP</li>
                <li>Data e hora de acesso</li>
                <li>Dispositivo, navegador e sistema operacional</li>
                <li>Logs de uso da plataforma</li>
                <li>Interações com funcionalidades, aulas e ferramentas</li>
              </ul>
            </section>

            <hr className="border-zinc-800" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">2. FINALIDADE DO USO DOS DADOS</h2>
              <p>Os dados coletados são utilizados para:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Criar e gerenciar contas de usuário</li>
                <li>Identificar e autenticar usuários</li>
                <li>Processar pagamentos e upgrades de plano</li>
                <li>Cumprir obrigações legais e regulatórias</li>
                <li>Fornecer suporte e atendimento</li>
                <li>Analisar uso da plataforma para melhoria contínua</li>
                <li>Prevenir fraudes e uso indevido</li>
                <li>Enviar comunicações operacionais e informativas</li>
              </ul>
              <p>
                A SOFIA <strong>não vende dados pessoais</strong>.
              </p>
            </section>

            <hr className="border-zinc-800" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">3. COMPARTILHAMENTO DE DADOS</h2>
              <p>Os dados poderão ser compartilhados apenas quando necessário, com:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Plataformas de pagamento</strong> (ex: Pagar.me), para processamento de transações
                </li>
                <li>
                  <strong>Provedores de infraestrutura</strong> (servidores, hospedagem, email)
                </li>
                <li>
                  <strong>Ferramentas de análise e monitoramento</strong>
                </li>
                <li>
                  <strong>Autoridades legais</strong>, mediante obrigação legal ou ordem judicial
                </li>
              </ul>
              <p>Sempre que possível, o compartilhamento ocorre de forma minimizada e segura.</p>
            </section>

            <hr className="border-zinc-800" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">4. ARMAZENAMENTO E SEGURANÇA</h2>
              <p>
                A SOFIA adota medidas técnicas e organizacionais adequadas para proteger os dados pessoais, incluindo:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Criptografia de senhas</li>
                <li>Controle de acesso</li>
                <li>Monitoramento de segurança</li>
                <li>Ambientes protegidos e segregados</li>
              </ul>
              <p>Os dados são armazenados apenas pelo tempo necessário para cumprir suas finalidades ou obrigações legais.</p>
            </section>

            <hr className="border-zinc-800" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">5. DIREITOS DO TITULAR DOS DADOS</h2>
              <p>Nos termos da LGPD, o usuário poderá solicitar, a qualquer momento:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Confirmação da existência de tratamento</li>
                <li>Acesso aos seus dados</li>
                <li>Correção de dados incompletos ou incorretos</li>
                <li>Exclusão de dados desnecessários ou excessivos</li>
                <li>Portabilidade, quando aplicável</li>
                <li>Revogação do consentimento</li>
              </ul>
              <p>As solicitações podem ser feitas pelos canais oficiais da plataforma.</p>
            </section>

            <hr className="border-zinc-800" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">6. COOKIES E TECNOLOGIAS SEMELHANTES</h2>
              <p>A SOFIA pode utilizar cookies e tecnologias similares para:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Melhorar a experiência do usuário</li>
                <li>Analisar desempenho</li>
                <li>Garantir funcionalidades essenciais</li>
              </ul>
              <p>
                O usuário pode gerenciar cookies por meio das configurações do navegador, ciente de que algumas
                funcionalidades podem ser afetadas.
              </p>
            </section>

            <hr className="border-zinc-800" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">7. DADOS DE MENORES</h2>
              <p>
                A plataforma SOFIA <strong>não é destinada a menores de 18 anos</strong>.
              </p>
              <p>Caso seja identificado o tratamento indevido de dados de menores, estes serão excluídos.</p>
            </section>

            <hr className="border-zinc-800" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">8. ALTERAÇÕES DESTA POLÍTICA</h2>
              <p>Esta Política de Privacidade pode ser atualizada a qualquer momento.</p>
              <p>As alterações entram em vigor a partir de sua publicação.</p>
              <p>O uso contínuo da plataforma após alterações representa concordância com os novos termos.</p>
            </section>

            <hr className="border-zinc-800" />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-white">9. LEGISLAÇÃO E FORO</h2>
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
              <p>O não exercício de qualquer direito previsto nesta Política não constitui renúncia.</p>
              <p>Caso alguma disposição seja considerada inválida, as demais permanecem em pleno vigor.</p>
            </section>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

