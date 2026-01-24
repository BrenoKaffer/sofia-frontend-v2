import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cadastro de Afiliado - SOFIA Admin",
};

export default function CadastroAfiliadoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
