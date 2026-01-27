'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Eye, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/auth-context';

interface RouletteSpin {
  id: string;
  table_id: string;
  spin_number: number;
  spin_timestamp: string;
}

interface RouletteDataDisplay {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
}

interface RouletteStatusProps {
  latestSpin: RouletteSpin | null;
  rouletteHistoryData: RouletteSpin[];
  activeTableId?: string | null;
}

// Dados das roletas serão carregados dinamicamente da API

export function RouletteStatus({ latestSpin, rouletteHistoryData, activeTableId }: RouletteStatusProps) {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const [selectedRouletteIndex, setSelectedRouletteIndex] = useState(0);
  const [rouletteTables, setRouletteTables] = useState<RouletteDataDisplay[]>([]);
  const [currentRouletteDisplay, setCurrentRouletteDisplay] = useState<RouletteDataDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [showIframe, setShowIframe] = useState(false);
  const [affiliateSlug, setAffiliateSlug] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [iframeFetching, setIframeFetching] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState<string | null>(null);

  const AFFILIATE_COOKIE = 'sofia_affiliate_slug';
  const FALLBACK_IFRAME_URL =
    'https://n1oyhyi5i6.rziikhgudx.net/gs2c/playGame.do?key=token%3DcugdACaloYKFy5DU%60%7C%60symbol%3D237%60%7C%60technology%3DH5%60%7C%60platform%3DWEB%60%7C%60language%3Dpt%60%7C%60cashierUrl%3Dhttps%3A%2F%2Fgoldebet.bet.br%2Fuser%2Fwallet%2Fdeposit%60%7C%60lobbyUrl%3Dhttps%3A%2F%2Fgoldebet.bet.br%2Fcasino%2Flive&amp;ppkv=2&amp;stylename=cstb_goldebet&amp;rcCloseUrl=https://goldebet.bet.br&amp;isGameUrlApiCalled=true';

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const fromQuery =
      String(searchParams.get('affiliate_slug') || searchParams.get('aff') || searchParams.get('affiliate') || '').trim() || null;

    const readCookie = (name: string): string | null => {
      const entries = String(document.cookie || '')
        .split(';')
        .map((c) => c.trim())
        .filter(Boolean);
      for (const c of entries) {
        if (!c.startsWith(`${name}=`)) continue;
        const raw = c.slice(name.length + 1);
        try {
          const decoded = decodeURIComponent(raw);
          return decoded.trim() ? decoded.trim() : null;
        } catch {
          return raw.trim() ? raw.trim() : null;
        }
      }
      return null;
    };

    if (fromQuery) {
      document.cookie = `${AFFILIATE_COOKIE}=${encodeURIComponent(fromQuery)}; Path=/; Max-Age=31536000; SameSite=Lax`;
      setAffiliateSlug(fromQuery);
      return;
    }

    const fromCookie = readCookie(AFFILIATE_COOKIE);
    setAffiliateSlug(fromCookie);
  }, [searchParams]);

  useEffect(() => {
    if (!showIframe || !currentRouletteDisplay) return;

    setIframeLoaded(false);
    setIframeError(null);

    if (!affiliateSlug) {
      setIframeUrl(null);
      return;
    }

    let active = true;
    setIframeFetching(true);

    const url = `/api/public/partner-table-links?${new URLSearchParams({
      affiliate_slug: affiliateSlug,
      table_id: currentRouletteDisplay.id,
    }).toString()}`;

    fetch(url, { cache: 'no-store' })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          const err = typeof (json as any)?.error === 'string' ? (json as any).error : 'Falha ao carregar link';
          throw new Error(err);
        }
        const nextUrl = String((json as any)?.iframe_url || '').trim();
        if (!active) return;
        if (!nextUrl) {
          setIframeUrl(null);
          setIframeError('Link não configurado para esta mesa.');
          return;
        }
        setIframeUrl(nextUrl);
      })
      .catch((err) => {
        if (!active) return;
        setIframeUrl(null);
        setIframeError(err instanceof Error ? err.message : 'Falha ao carregar link');
      })
      .finally(() => {
        if (!active) return;
        setIframeFetching(false);
      });

    return () => {
      active = false;
    };
  }, [affiliateSlug, currentRouletteDisplay?.id, showIframe]);

  // Buscar roletas monitoradas da API (já filtradas no backend)
  useEffect(() => {
    const fetchRouletteTables = async () => {
      try {
        const token = await getToken();
        // A API /api/roulette-tables já retorna apenas as mesas monitoradas
        const tablesResponse = await fetch('/api/roulette-tables', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (tablesResponse.ok) {
          const tables = await tablesResponse.json();
          
          setRouletteTables(tables);
          if (tables.length > 0) {
            setCurrentRouletteDisplay(tables[0]);
          }
        } else {
          // Fallback apenas se a API falhar
          const fallbackTables = [
            { id: 'pragmatic-brazilian', name: 'Roleta Brasileira', status: 'online' as const },
            { id: 'pragmatic-mega-roulette', name: 'Mega Roulette', status: 'online' as const },
          ];
          setRouletteTables(fallbackTables);
          setCurrentRouletteDisplay(fallbackTables[0]);
        }
      } catch (error) {
        // Fallback para dados padrão
        const fallbackTables = [
          { id: 'pragmatic-brazilian', name: 'Roleta Brasileira', status: 'online' as const },
          { id: 'pragmatic-mega-roulette', name: 'Mega Roulette', status: 'online' as const },
          { id: 'evolution-immersive', name: 'Immersive Roulette', status: 'online' as const },
          { id: 'evolution-live', name: 'Roleta ao Vivo', status: 'online' as const },
        ];
        setRouletteTables(fallbackTables);
        setCurrentRouletteDisplay(fallbackTables[0]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRouletteTables();
  }, [getToken]);

  useEffect(() => {
    if (activeTableId && rouletteTables.length > 0) {
      const index = rouletteTables.findIndex(t => t.id === activeTableId);
      if (index !== -1) {
        setSelectedRouletteIndex(index);
        setShowIframe(true); // Auto-open iframe on active signal
      }
    }
  }, [activeTableId, rouletteTables]);

  useEffect(() => {
    if (selectedRouletteIndex < rouletteTables.length) {
      setCurrentRouletteDisplay(rouletteTables[selectedRouletteIndex]);
    }
  }, [selectedRouletteIndex, rouletteTables]);

  // Lógica para obter hot/cold numbers a partir do histórico
  const getHotColdNumbers = (history: RouletteSpin[]) => {
    // Normalizar: garantir que seja array
    if (!Array.isArray(history) || history.length === 0) {
      return { hotNumbers: [], coldNumbers: [] };
    }

    const counts: { [key: number]: number } = {};
    for (const spin of history) {
      const num = typeof spin.spin_number === 'number' ? spin.spin_number : parseInt(String(spin.spin_number));
      if (!Number.isNaN(num)) {
        counts[num] = (counts[num] || 0) + 1;
      }
    }

    const sortedNumbers = Object.entries(counts).sort(([, countA], [, countB]) => (countB as number) - (countA as number));
    const hotNumbers = sortedNumbers.slice(0, 3).map(([num]) => parseInt(num));
    const coldNumbers = sortedNumbers.slice(-3).map(([num]) => parseInt(num));

    return { hotNumbers, coldNumbers };
  };

  // Array seguro para histórico
  const safeHistory = Array.isArray(rouletteHistoryData) ? rouletteHistoryData : [];

  const { hotNumbers, coldNumbers } = getHotColdNumbers(safeHistory);
  
  const getTimeAgo = (spin_timestamp: string) => {
    const now = new Date();
    const spinTime = new Date(spin_timestamp);
    const diffInMinutes = Math.floor((now.getTime() - spinTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}h atrás`;
  };

  const getNumberColor = (number: number) => {
    if (number === 0) return 'bg-green-500';
    const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    return redNumbers.includes(number) ? 'bg-red-500' : 'bg-black';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'maintenance': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="font-heading">Status das Roletas</CardTitle>
            <p className="text-sm text-muted-foreground mt-1 font-sans">
              Monitoramento em tempo real
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Roulette selector */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 rounded-lg border animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                      <div className="h-4 bg-gray-300 rounded w-32"></div>
                    </div>
                    <div className="w-16 h-6 bg-gray-300 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            rouletteTables.map((roulette, index) => (
            <motion.div
              key={roulette.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedRouletteIndex === index 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50 hover:bg-primary/5'
              }`}
              onClick={() => setSelectedRouletteIndex(index)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className={`w-3 h-3 rounded-full ${getStatusColor(roulette.status)}`}
                    animate={roulette.status === 'online' ? {
                      opacity: [1, 0.3, 1],
                      scale: [1, 1.2, 1]
                    } : {}}
                    transition={{
                      duration: 2,
                      repeat: roulette.status === 'online' ? Infinity : 0,
                      ease: "easeInOut"
                    }}
                  />
                  <span className="font-medium font-heading">{roulette.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-sans">
                    {Math.floor(Math.random() * 500) + 100}
                  </span>
                </div>
              </div>
            </motion.div>
            ))
          )}
            </div>

        {/* Iframe View or Details */}
        {showIframe && currentRouletteDisplay ? (
          <div className="relative aspect-video w-full border border-border bg-black rounded-lg overflow-hidden shadow-2xl" id="game">
              {/* Loading Spinner */}
              {(iframeFetching || (!iframeLoaded && (!affiliateSlug || Boolean(iframeUrl)))) && (
                <div className="absolute z-10 inset-0 flex items-center justify-center bg-black/50">
                  <Activity className="w-10 h-10 text-primary animate-spin" />
                </div>
              )}
              
              {/* Game Iframe */}
              {(() => {
                const src = affiliateSlug ? iframeUrl : FALLBACK_IFRAME_URL;
                if (!src) {
                  return (
                    <div className="relative z-20 flex h-full w-full items-center justify-center p-6 text-center text-sm text-white/80">
                      <div>
                        <div className="font-semibold">Mesa indisponível</div>
                        <div className="mt-2">{iframeError || 'Não foi possível carregar o link desta mesa.'}</div>
                      </div>
                    </div>
                  );
                }

                return (
                  <iframe
                    src={src}
                    className="relative z-20 h-full w-full"
                    allowFullScreen
                    allow="autoplay; fullscreen"
                    onLoad={() => setIframeLoaded(true)}
                  />
                );
              })()}

              <button 
                className="absolute top-3 right-3 text-white/50 hover:text-white hover:bg-black/50 p-2 rounded-full transition-all z-30"
                onClick={() => {
                  setShowIframe(false);
                  setIframeUrl(null);
                  setIframeLoaded(false);
                  setIframeError(null);
                }}
              >
                <span className="sr-only">Fechar</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
              </button>
          </div>
        ) : (
        /* Selected roulette details */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium font-heading">{currentRouletteDisplay?.name || 'Carregando...'}</h4>
            <div className="flex items-center gap-2">
              {currentRouletteDisplay?.status === 'online' ? (
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-2 h-2 bg-green-500 rounded-full"
                    animate={{
                      opacity: [1, 0.3, 1],
                      scale: [1, 1.3, 1]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  <span className="text-sm font-medium text-green-600">Sistema Ativo</span>
                </div>
              ) : (
                <Badge variant="destructive">
                  {currentRouletteDisplay?.status === 'offline' ? 'Offline' : 'Manutenção'}
                </Badge>
              )}
            </div>
            {/* Botão para abrir Iframe manualmente */}
            {currentRouletteDisplay && (
               <button 
                 onClick={() => setShowIframe(true)}
                 className="text-xs bg-primary/10 text-primary hover:bg-primary/20 px-2 py-1 rounded transition-colors"
               >
                 Abrir Mesa
               </button>
            )}
          </div>

          {/* Current spin (if available via Realtime) */}
          {latestSpin && currentRouletteDisplay && latestSpin.table_id === currentRouletteDisplay.id ? (
             <motion.div
                key={latestSpin.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="text-center py-6"
             >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-white font-bold text-xl ${getNumberColor(latestSpin.spin_number)}`}>
                  {latestSpin.spin_number}
                </div>
                <p className="text-sm text-muted-foreground mt-2 font-sans">Último Número!</p>
            </motion.div>
          ) : (
             <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full text-white font-bold text-xl">
                    ?
                </div>
                <p className="text-sm text-muted-foreground mt-2 font-sans">Aguardando novo giro...</p>
            </div>
          )}

          {/* Last numbers */}
          <div>
            <p className="text-sm text-muted-foreground mb-3 font-heading">Últimos números</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(safeHistory)
                .filter(spin => currentRouletteDisplay && spin.table_id === currentRouletteDisplay.id)
                .slice(0, 7)
                .map((spin, index) => (
                  <motion.div
                    key={spin.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${getNumberColor(spin.spin_number)}`}
                  >
                    {spin.spin_number}
                  </motion.div>
              ))}
            </div>
          </div>

          {/* Hot numbers */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-red-500" />
              <p className="text-sm text-muted-foreground font-heading">Números Quentes</p>
            </div>
            <div className="flex gap-2">
              {hotNumbers.map((number, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.1 }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${getNumberColor(number)}`}
                >
                  {number}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Cold numbers */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground font-heading">Números Frios</p>
            </div>
            <div className="flex gap-2">
              {coldNumbers.map((number, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.1 }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${getNumberColor(number)}`}
                >
                  {number}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Activity indicator */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground font-heading">Atividade</p>
              <span className="text-sm font-medium font-sans">
                {currentRouletteDisplay?.status === 'online' ? '100%' : '0%'}
              </span>
            </div>
            <Progress value={currentRouletteDisplay?.status === 'online' ? 100 : 0} className="h-2" />
          </div>
        </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RouletteStatus;
