import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cadastro de Parceiro - SOFIA Admin",
};

export default function CadastroParceiroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
