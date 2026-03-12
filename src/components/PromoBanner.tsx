import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

const getApiBase = () => (typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api');

type BannerSlide = {
  id: string;
  title: string;
  subtitle: string | null;
  badge: string | null;
  ctaText: string;
  ctaLink: string;
  gradient: string;
};

const DEFAULT_BANNER: BannerSlide = {
  id: 'default',
  title: 'Explore New Courses',
  subtitle: 'Level up your data skills. Browse our courses and start learning today.',
  badge: 'New',
  ctaText: 'Browse Courses',
  ctaLink: '/student/marketplace',
  gradient: 'from-violet-600 via-purple-600 to-indigo-700',
};

const PromoBanner: React.FC = () => {
  const [slides, setSlides] = useState<BannerSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = `${getApiBase().replace(/\/$/, '')}/promo-banners`;
        const res = await fetch(url, { credentials: 'include' });
        if (!cancelled && res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
          setSlides(list.length > 0 ? list : [DEFAULT_BANNER]);
        } else if (!cancelled) {
          setSlides([DEFAULT_BANNER]);
        }
      } catch {
        if (!cancelled) setSlides([DEFAULT_BANNER]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSelect = useCallback((carouselApi: CarouselApi | null) => {
    if (!carouselApi) return;
    setCurrent(carouselApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!api) return;
    onSelect(api);
    api.on('select', () => onSelect(api));
  }, [api, onSelect]);

  useEffect(() => {
    if (!api || slides.length <= 1) return;
    const interval = setInterval(() => api.scrollNext(), 5000);
    return () => clearInterval(interval);
  }, [api, slides.length]);

  if (loading) return null;
  if (slides.length === 0) return null;

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-xl border border-white/10">
      <Carousel setApi={setApi} opts={{ loop: slides.length > 1, align: 'start' }} className="w-full">
        <CarouselContent className="-ml-0">
          {slides.map((slide) => (
            <CarouselItem key={slide.id} className="pl-0">
              <Link
                to={slide.ctaLink.startsWith('/') ? slide.ctaLink : `/${slide.ctaLink}`}
                className={cn(
                  'block relative overflow-hidden rounded-2xl bg-gradient-to-br min-h-[160px] sm:min-h-[180px] p-6 sm:p-8',
                  'text-white transition-transform duration-300 hover:scale-[1.01] active:scale-[0.99]',
                  slide.gradient,
                )}
              >
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '24px 24px',
                  }}
                />
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center bg-white/15">
                    <Rocket className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {slide.badge && (
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border border-white/40 bg-white/20 text-white mb-2">
                        {slide.badge}
                      </span>
                    )}
                    <h2 className="text-xl sm:text-2xl font-display font-bold leading-tight mb-1 drop-shadow-sm">
                      {slide.title}
                    </h2>
                    {slide.subtitle && (
                      <p className="text-white/90 text-sm sm:text-base max-w-xl">
                        {slide.subtitle}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-gray-900 shadow-lg transition-colors hover:bg-gray-100">
                      {slide.ctaText}
                    </span>
                  </div>
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {slides.length > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                current === index ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PromoBanner;
