import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-5xl font-bold tracking-tight">404</h1>
        <p className="text-muted-foreground">Página não encontrada</p>
        <Link href="/">
          <Button>Voltar ao início</Button>
        </Link>
      </div>
    </div>
  );
}

