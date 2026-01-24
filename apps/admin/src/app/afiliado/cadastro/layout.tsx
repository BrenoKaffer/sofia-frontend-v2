import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cadastro de Parceiro - SOFIA Admin",
  icons: {
    icon: "/favicon-affiliate.png",
    shortcut: "/favicon-affiliate.png",
    apple: "/favicon-affiliate.png",
  },
};

export default function CadastroAfiliadoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
