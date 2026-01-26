"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { NetflixTopBar } from "@/components/layout/netflix-top-bar";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
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

  return (
    <section
      className={cn(
        "relative w-full h-screen overflow-hidden bg-background flex flex-col items-center justify-center text-center px-4",
        className
      )}
    >
      <div className="z-10 flex flex-col items-center">
        {/* Tagline */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={FADE_IN_ANIMATION_VARIANTS}
          className="mb-4 inline-block rounded-full border border-border bg-card/50 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm"
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
          className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground"
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
          className="mt-6 max-w-xl text-lg text-muted-foreground"
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
          animate={{
            x: ["-100%", "0%"],
            transition: {
              ease: "linear",
              duration: 40,
              repeat: Infinity,
            },
          }}
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
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

/**
 * @interface Article
 * Defines the structure for a single article card.
 * @param {string | number} id - A unique identifier for the article.
 * @param {string} imageSrc - URL for the article's image.
 * @param {string} title - The main heading of the article.
 * @param {string} linkText - The text for the call-to-action link.
 * @param {string} linkHref - The URL the article card will link to.
 */
interface Article {
  id: string | number;
  imageSrc: string;
  title: string;
  linkText: string;
  linkHref: string;
}

/**
 * @interface ArticleCardGridProps
 * Defines the props for the ArticleCardGrid component.
 * @param {string} title - The main title displayed above the grid.
 * @param {Article[]} articles - An array of article objects to display.
 */
interface ArticleCardGridProps {
  title: string;
  articles: Article[];
}

/**
 * A responsive grid of article cards with a title.
 * Features animations on load and hover.
 */
const ArticleCardGrid: React.FC<ArticleCardGridProps> = ({ title, articles }) => {
  // Animation variant for the grid container to stagger children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  // Animation variant for each card item
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  return (
    <section className="w-full max-w-6xl mx-auto py-12 px-4 md:px-6 bg-background text-foreground">
      <h2 className="text-3xl font-bold tracking-tight mb-8">
        {title}
      </h2>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {articles.map((article) => (
          <motion.a
            key={article.id}
            href={article.linkHref}
            className="group block overflow-hidden rounded-lg bg-card border hover:border-primary/50 transition-colors duration-300"
            variants={itemVariants}
            whileHover={{ y: -8 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex flex-col h-full">
              {/* Card Image */}
              <div className="overflow-hidden">
                 <motion.img
                    src={article.imageSrc}
                    alt={article.title}
                    className="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-300"
                    whileHover={{ scale: 1.08 }}
                    transition={{ type: "spring", stiffness: 250, damping: 18 }}
                  />
              </div>

              {/* Card Content */}
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold text-card-foreground mb-4 flex-grow">
                  {article.title}
                </h3>
                <div className="flex items-center text-sm font-medium text-primary mt-auto">
                  {article.linkText}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </motion.a>
        ))}
      </motion.div>
    </section>
  );
};

type TemplateRow = {
  id: string
  user_id: string
  name: string
  description: string | null
  builder_payload: any
  is_published: boolean
  published_strategy_slug: string | null
}

function sigFromString(value: string): number {
  let acc = 0
  for (let i = 0; i < value.length; i++) acc = (acc + value.charCodeAt(i) * (i + 1)) % 1000
  return acc
}

const UNSPLASH_PHOTO_IDS = [
  "ax_jJpHdYjI",
  "mD1V-eS1Wb4",
  "1S-VJgvh_Oc",
  "2y7yiuEgT3k",
  "3-dz_zeSiI4",
  "pHUF3pNk1XA",
  "TtAoOVEXgMw",
  "Nwpyc1dks4g",
  "-6GvTDpkkPU",
  "Wl5vq0X1eEw",
  "0KF9Q0Nu4Nw",
  "bYtIpXnzsQM",
  "mC_g8eqXV9U",
  "xP6ngsgxck0",
]

function pickUnsplashPhotoId(seed: number): string {
  const safeSeed = Number.isFinite(seed) ? Math.abs(seed) : 0
  return UNSPLASH_PHOTO_IDS[safeSeed % UNSPLASH_PHOTO_IDS.length]
}

function unsplashPhotoUrl(opts: { width: number; height: number; seed: number }): string {
  const id = pickUnsplashPhotoId(opts.seed)
  return `https://source.unsplash.com/${id}/${opts.width}x${opts.height}`
}

function getTemplateImage(tpl: TemplateRow): string {
  const meta = tpl?.builder_payload && typeof tpl.builder_payload === "object" ? tpl.builder_payload.metadata : null
  const image = meta && typeof meta === "object" ? String((meta as any)?.image || "").trim() : ""
  if (image) return image
  const seed = sigFromString(String(tpl?.id || tpl?.name || "sofia"))
  return unsplashPhotoUrl({ width: 900, height: 700, seed })
}

export default function Marketplace2Page() {
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const { setTheme } = useTheme()
  const [randomSeed, setRandomSeed] = useState<number | null>(null)

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

  const mockArticles = useMemo(() => {
    const baseSeed = randomSeed ?? 1
    const base = [
      { title: "Conexão de Cores SOFIA" },
      { title: "Puxador de Terminais" },
      { title: "Estratégia de Espelho" },
      { title: "Estratégia de Ausência" },
      { title: "Alternância" },
      { title: "Setor Dominante" },
    ]
    return base.map((b, idx) => ({
      id: `mock-${idx + 1}`,
      imageSrc: unsplashPhotoUrl({ width: 900, height: 700, seed: baseSeed + (idx + 1) * 37 }),
      title: b.title,
      linkText: "Usar no Builder",
      linkHref: "/builder",
    }))
  }, [randomSeed])

  const articles = useMemo(() => {
    const published = templates.filter(t => Boolean((t as any)?.is_published))
    const mapped = published.map((t) => ({
      id: t.id,
      imageSrc: getTemplateImage(t),
      title: t.name,
      linkText: "Usar no Builder",
      linkHref: `/builder?templateId=${encodeURIComponent(t.id)}`
    }))
    return mapped.length ? mapped : mockArticles
  }, [templates, mockArticles])

  const heroImages = useMemo(
    () => [
      unsplashPhotoUrl({ width: 720, height: 960, seed: (randomSeed ?? 1) + 11 }),
      unsplashPhotoUrl({ width: 720, height: 960, seed: (randomSeed ?? 1) + 12 }),
      unsplashPhotoUrl({ width: 720, height: 960, seed: (randomSeed ?? 1) + 13 }),
      unsplashPhotoUrl({ width: 720, height: 960, seed: (randomSeed ?? 1) + 14 }),
      unsplashPhotoUrl({ width: 720, height: 960, seed: (randomSeed ?? 1) + 15 }),
      unsplashPhotoUrl({ width: 720, height: 960, seed: (randomSeed ?? 1) + 16 }),
      unsplashPhotoUrl({ width: 720, height: 960, seed: (randomSeed ?? 1) + 17 }),
      unsplashPhotoUrl({ width: 720, height: 960, seed: (randomSeed ?? 1) + 18 }),
    ],
    [randomSeed]
  );

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
      <ArticleCardGrid title="Estratégias" articles={articles} />
    </div>
  );
}
