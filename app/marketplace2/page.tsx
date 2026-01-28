"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { NetflixTopBar } from "@/components/layout/netflix-top-bar";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileCard } from "@/components/profile-card";
import { ArrowRight } from "lucide-react";

// Props interface for the component
interface AnimatedMarqueeHeroProps {
  tagline: string;
  title: React.ReactNode;
  description: string;
  ctaText: string;
  images: string[];
  className?: string;
}

// Reusable Button component styled like in the image
const ActionButton = ({ children }: { children: React.ReactNode }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="mt-8 px-8 py-3 rounded-full bg-red-500 text-white font-semibold shadow-lg transition-colors hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75"
  >
    {children}
  </motion.button>
);

// The main hero component
const AnimatedMarqueeHero: React.FC<AnimatedMarqueeHeroProps> = ({
  tagline,
  title,
  description,
  ctaText,
  images,
  className,
}) => {
  // Animation variants for the text content
  const FADE_IN_ANIMATION_VARIANTS = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } },
  };

  // Duplicate images for a seamless loop
  const duplicatedImages = [...images, ...images];
  const muxSrc =
    "https://player.mux.com/C01VY9EnSzUxEnEWrQjA15A6ngnqRFcle7CYuLwA7g700?metadata-video-title=15142673_3840_2160_60fps&video-title=15142673_3840_2160_60fps&autoplay=1&loop=1&muted=1&controls=0&playsinline=1";

  return (
    <section
      className={cn(
        "relative w-full h-screen overflow-hidden bg-background flex flex-col items-center justify-center text-center px-4",
        className
      )}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 overflow-hidden">
          <iframe
            src={muxSrc}
            title="Vídeo de fundo"
            className="absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-[60%] md:-translate-y-[56%]"
            style={{ width: "100%", border: "none", aspectRatio: "16/9" }}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
          />
        </div>
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/85" />
      </div>

      <div className="z-10 flex flex-col items-center">
        {/* Tagline */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={FADE_IN_ANIMATION_VARIANTS}
          className="mb-4 inline-block rounded-full border border-white/15 bg-black/25 px-4 py-1.5 text-sm font-medium text-white/85 backdrop-blur-sm"
        >
          {tagline}
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
          className="text-5xl md:text-7xl font-bold tracking-tighter text-white"
        >
          {typeof title === 'string' ? (
            title.split(" ").map((word, i) => (
              <motion.span
                key={i}
                variants={FADE_IN_ANIMATION_VARIANTS}
                className="inline-block"
              >
                {word}&nbsp;
              </motion.span>
            ))
          ) : (
            title
          )}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial="hidden"
          animate="show"
          variants={FADE_IN_ANIMATION_VARIANTS}
          transition={{ delay: 0.5 }}
          className="mt-6 max-w-xl text-lg text-white/80"
        >
          {description}
        </motion.p>

        {/* Call to Action Button */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={FADE_IN_ANIMATION_VARIANTS}
          transition={{ delay: 0.6 }}
        >
          <ActionButton>{ctaText}</ActionButton>
        </motion.div>
      </div>

      {/* Animated Image Marquee */}
      <div className="absolute bottom-0 left-0 w-full h-1/3 md:h-2/5 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]">
        <motion.div
          className="flex gap-4"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ ease: "linear", duration: 40, repeat: Infinity }}
          style={{ width: "max-content", willChange: "transform" }}
        >
          {duplicatedImages.map((src, index) => (
            <motion.div
              key={index}
              className="relative aspect-[3/4] h-48 md:h-64 flex-shrink-0"
              animate={{ y: [0, -8, 0] }}
              transition={{
                ease: "easeInOut",
                duration: 3.2 + (index % 5) * 0.35,
                repeat: Infinity,
              }}
              style={{
                rotate: `${(index % 2 === 0 ? -2 : 5)}deg`,
              }}
            >
              <img
                src={src}
                alt={`Showcase image ${index + 1}`}
                className="w-full h-full object-cover rounded-2xl shadow-md"
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.src = "/hero-poster.jpg";
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

type MarketplaceCard = {
  id: string
  title: string
  description?: string
  authorName: string
  authorAvatarUrl?: string | null
  templateId?: string
  template?: TemplateRow | null
  imageUrl?: string
  isVerified?: boolean
  followers?: number
  following?: number
}

function safeInitials(value: string): string {
  const cleaned = String(value || "").trim()
  if (!cleaned) return "S"
  const parts = cleaned.split(/\s+/).filter(Boolean)
  const first = parts[0]?.charAt(0) || "S"
  const last = (parts.length > 1 ? parts[parts.length - 1]?.charAt(0) : "") || ""
  return (first + last).toUpperCase()
}

function getYoutubeEmbedUrl(raw: string | null | undefined): string | null {
  const input = String(raw || "").trim()
  if (!input) return null

  try {
    const url = new URL(input)
    const host = url.hostname.toLowerCase()

    if (host === "youtu.be") {
      const id = url.pathname.replace("/", "").trim()
      return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null
    }

    if (host.endsWith("youtube.com")) {
      const path = url.pathname
      if (path.startsWith("/embed/")) {
        const id = path.replace("/embed/", "").split("/")[0]?.trim()
        return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null
      }

      const v = url.searchParams.get("v")
      return v ? `https://www.youtube.com/embed/${encodeURIComponent(v)}` : null
    }

    return null
  } catch {
    return null
  }
}

function extractRules(meta: any): string[] {
  const rules = meta?.rules
  if (Array.isArray(rules)) return rules.map((r: any) => String(r).trim()).filter(Boolean)
  if (typeof rules === "string") {
    return rules
      .split(/\r?\n|\s*\-\s+/)
      .map((x) => String(x).trim())
      .filter(Boolean)
  }
  return []
}

function extractMetrics(meta: any): Array<{ label: string; value: string }> {
  const metrics = meta?.metrics
  if (!metrics || typeof metrics !== "object") return []
  return Object.entries(metrics)
    .map(([k, v]) => ({ label: String(k), value: typeof v === "string" ? v : JSON.stringify(v) }))
    .filter((m) => m.label && m.value)
}

function extractUpdates(meta: any): string[] {
  const updates = meta?.updates || meta?.changelog || meta?.history
  if (Array.isArray(updates)) return updates.map((u: any) => String(u).trim()).filter(Boolean)
  return []
}

function buildTemplateDownloadFile(tpl: TemplateRow) {
  const payload = tpl?.builder_payload
  const schemaVersion = String(payload?.schemaVersion || payload?.schema_version || "1.0.0")
  const nodes = Array.isArray(payload?.nodes) ? payload.nodes : []
  const connections = Array.isArray(payload?.connections) ? payload.connections : []
  const selectionMode = payload?.selectionMode
  const gating = payload?.gating
  const meta = payload && typeof payload === "object" ? (payload as any).metadata : undefined

  return {
    type: "sofia_strategy_template",
    schemaVersion,
    templateId: tpl?.id ? String(tpl.id) : undefined,
    name: String(tpl?.name || "Template do Builder"),
    description: typeof tpl?.description === "string" ? tpl.description : undefined,
    author: meta?.author,
    tags: meta?.tags,
    metadata: meta,
    graph: {
      schemaVersion,
      nodes,
      connections,
      selectionMode,
      gating,
    },
    createdAt: tpl?.created_at ? new Date(tpl.created_at).toISOString() : undefined,
    updatedAt: tpl?.updated_at ? new Date(tpl.updated_at).toISOString() : undefined,
  }
}

function downloadJsonFile(filename: string, json: any) {
  const text = JSON.stringify(json, null, 2)
  const blob = new Blob([text], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const StrategyTemplateGrid = ({ title, cards, onOpen }: { title: string; cards: MarketplaceCard[]; onOpen: (c: MarketplaceCard) => void }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  }

  const itemVariants = {
    hidden: { y: 14, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 110, damping: 18 },
    },
  }

  return (
    <section className="w-full bg-white text-black">
      <div className="w-full max-w-6xl mx-auto py-12 px-4 md:px-6">
        <h2 className="text-3xl font-bold tracking-tight mb-8">{title}</h2>

        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" variants={containerVariants} initial="hidden" animate="visible">
          {cards.map((card) => (
            <motion.div
              key={card.id}
              onClick={() => onOpen(card)}
              className="w-full"
              variants={itemVariants}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300 }}
              role="button"
              tabIndex={0}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onOpen(card)
                }
              }}
              aria-label={`Abrir detalhes: ${card.title}`}
            >
              <div className="w-full flex justify-center">
                <ProfileCard
                  name={card.title}
                  description={card.description || `por ${card.authorName}`}
                  image={card.imageUrl}
                  isVerified={card.isVerified}
                  followers={card.followers}
                  following={card.following}
                  showActionButton
                  actionText={
                    <span className="inline-flex items-center justify-center gap-2">
                      Abrir
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  }
                  onActionClick={() => onOpen(card)}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

type TemplateRow = {
  id: string
  user_id: string
  name: string
  description: string | null
  builder_payload: any
  is_published: boolean
  published_strategy_slug: string | null
  created_at?: string
  updated_at?: string
  author_profile?: { user_id: string; full_name?: string | null; avatar_url?: string | null } | null
}

function sigFromString(value: string): number {
  let acc = 0
  for (let i = 0; i < value.length; i++) acc = (acc + value.charCodeAt(i) * (i + 1)) % 1000
  return acc
}

function picsumPhotoUrl(opts: { width: number; height: number; seed: number }): string {
  const safeSeed = Number.isFinite(opts.seed) ? Math.abs(Math.trunc(opts.seed)) : 0
  return `https://picsum.photos/seed/sofia-${safeSeed}/${opts.width}/${opts.height}`
}

function getTemplateImage(tpl: TemplateRow): string {
  const meta = tpl?.builder_payload && typeof tpl.builder_payload === "object" ? tpl.builder_payload.metadata : null
  const image = meta && typeof meta === "object" ? String((meta as any)?.image || "").trim() : ""
  if (image) {
    try {
      const parsed = new URL(image)
      const host = parsed.hostname.toLowerCase()
      if (!host.includes("unsplash.com")) return image
    } catch {
      if (!image.toLowerCase().includes("unsplash.com")) return image
    }
  }
  const seed = sigFromString(String(tpl?.id || tpl?.name || "sofia"))
  return picsumPhotoUrl({ width: 900, height: 700, seed })
}

export default function Marketplace2Page() {
  const router = useRouter()
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const { setTheme } = useTheme()
  const [randomSeed, setRandomSeed] = useState<number | null>(null)
  const [selectedCard, setSelectedCard] = useState<MarketplaceCard | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    setTheme("light")
    setRandomSeed(Math.floor(Math.random() * 1_000_000))
    ;(async () => {
      try {
        const resp = await fetch("/api/dynamic-strategies/templates", { cache: "no-store" })
        const data = await resp.json().catch(() => ({}))
        const list = Array.isArray((data as any)?.templates) ? ((data as any).templates as TemplateRow[]) : []
        setTemplates(list)
      } catch {
        setTemplates([])
      }
    })()
  }, [setTheme])

  const cards = useMemo<MarketplaceCard[]>(() => {
    const published = templates.filter((t) => Boolean((t as any)?.is_published))

    const mapped = published.map((t) => {
      const meta = t?.builder_payload && typeof t.builder_payload === "object" ? (t.builder_payload as any).metadata : null
      const displayName = String(meta?.author?.displayName || "").trim()
      const authorName = String(t?.user_id || "") === "system"
        ? "SOFIA"
        : (displayName || String(t?.author_profile?.full_name || "").trim() || "Autor")
      const seed = sigFromString(String(t?.id || t?.name || "sofia"))

      return {
        id: t.id,
        title: String(t?.name || ""),
        description: t.description || undefined,
        authorName,
        authorAvatarUrl: t?.author_profile?.avatar_url || null,
        templateId: t.id,
        template: t,
        imageUrl: getTemplateImage(t),
        isVerified: true,
        followers: 120 + (seed % 900),
        following: 20 + (seed % 180),
      }
    })

    if (mapped.length) return mapped

    const base = [
      { title: "Conexão de Cores SOFIA" },
      { title: "Puxador de Terminais" },
      { title: "Estratégia de Espelho" },
      { title: "Estratégia de Ausência" },
      { title: "Alternância" },
      { title: "Setor Dominante" },
    ]

    return base.map((b, idx) => {
      const id = `mock-${idx + 1}`
      const seed = sigFromString(id)
      return {
        id,
        title: b.title,
        description: "Em breve no marketplace.",
        authorName: "SOFIA",
        authorAvatarUrl: null,
        templateId: undefined,
        template: null,
        imageUrl: picsumPhotoUrl({ width: 800, height: 800, seed }),
        isVerified: false,
        followers: 60 + (seed % 500),
        following: 10 + (seed % 120),
      }
    })
  }, [templates])

  const heroImages = useMemo(
    () => [
      picsumPhotoUrl({ width: 720, height: 960, seed: (randomSeed ?? 1) + 11 }),
      picsumPhotoUrl({ width: 720, height: 960, seed: (randomSeed ?? 1) + 12 }),
      picsumPhotoUrl({ width: 720, height: 960, seed: (randomSeed ?? 1) + 13 }),
      picsumPhotoUrl({ width: 720, height: 960, seed: (randomSeed ?? 1) + 14 }),
      picsumPhotoUrl({ width: 720, height: 960, seed: (randomSeed ?? 1) + 15 }),
      picsumPhotoUrl({ width: 720, height: 960, seed: (randomSeed ?? 1) + 16 }),
      picsumPhotoUrl({ width: 720, height: 960, seed: (randomSeed ?? 1) + 17 }),
      picsumPhotoUrl({ width: 720, height: 960, seed: (randomSeed ?? 1) + 18 }),
    ],
    [randomSeed]
  );

  const selectedMeta = useMemo(() => {
    const tpl = selectedCard?.template
    const payload = tpl?.builder_payload
    return payload && typeof payload === "object" ? (payload as any).metadata : null
  }, [selectedCard])

  const rules = useMemo(() => extractRules(selectedMeta), [selectedMeta])
  const metrics = useMemo(() => extractMetrics(selectedMeta), [selectedMeta])
  const updates = useMemo(() => extractUpdates(selectedMeta), [selectedMeta])
  const youtubeEmbed = useMemo(() => getYoutubeEmbedUrl(selectedMeta?.youtubeUrl || selectedMeta?.youtube), [selectedMeta])

  const onOpen = (c: MarketplaceCard) => {
    setSelectedCard(c)
    setDetailsOpen(true)
  }

  const onImport = () => {
    const templateId = String(selectedCard?.templateId || "").trim()
    if (!templateId) return
    router.push(`/builder?templateId=${encodeURIComponent(templateId)}&imported=1`)
  }

  const onDownload = () => {
    const tpl = selectedCard?.template
    if (!tpl) return
    const safeName = String(tpl?.name || "template")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
    const filename = `sofia-template-${safeName}-${tpl.id}.json`
    downloadJsonFile(filename, buildTemplateDownloadFile(tpl))
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NetflixTopBar />
      <AnimatedMarqueeHero
        className="pt-16"
        tagline="Marketplace"
        title="Marketplace de Estratégias"
        description="Explore estratégias e carregue no seu Builder em um clique."
        ctaText="Ver estratégias"
        images={heroImages}
      />

      <StrategyTemplateGrid title="Estratégias" cards={cards} onOpen={onOpen} />

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCard?.title || "Estratégia"}</DialogTitle>
            <DialogDescription>
              {selectedCard?.authorName ? `por ${selectedCard.authorName}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedCard?.authorAvatarUrl || undefined} alt={selectedCard?.authorName || "Autor"} />
                <AvatarFallback>{safeInitials(selectedCard?.authorName || "S")}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="font-medium truncate">{selectedCard?.authorName || "Autor"}</div>
                <div className="text-sm text-muted-foreground">{selectedCard?.description || "Sem descrição"}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold">Regras da estratégia</div>
              {rules.length ? (
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {rules.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-muted-foreground">Sem regras cadastradas.</div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold">Métricas-chave</div>
              {metrics.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {metrics.map((m) => (
                    <div key={m.label} className="rounded-lg border bg-card px-3 py-2">
                      <div className="text-xs text-muted-foreground">{m.label}</div>
                      <div className="text-sm font-medium">{m.value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Sem métricas cadastradas.</div>
              )}
            </div>

            {youtubeEmbed ? (
              <div className="space-y-2">
                <div className="text-sm font-semibold">Vídeo</div>
                <div className="aspect-video w-full overflow-hidden rounded-lg border">
                  <iframe
                    className="h-full w-full"
                    src={youtubeEmbed}
                    title="Vídeo da estratégia"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="text-sm font-semibold">Histórico de updates</div>
              {updates.length ? (
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {updates.map((u, idx) => (
                    <li key={idx}>{u}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-muted-foreground">Sem updates registrados.</div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={onDownload} disabled={!selectedCard?.template}>
              Download (JSON)
            </Button>
            <Button onClick={onImport} disabled={!selectedCard?.templateId}>
              Importar no Builder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
