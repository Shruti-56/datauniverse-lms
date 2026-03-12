import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ADS_LANDING, CONTACT } from "@/config/adsLanding";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import {
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  User,
  Zap,
  ArrowRight,
  Star,
  Users,
  Clock,
  Shield,
  Calendar,
  Quote,
  Gift,
  Target,
  Play,
  BadgeCheck,
  TrendingUp,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { INSTITUTE_NAME } from "@/config/marketing";

const PAGE_SLUG = ADS_LANDING.pageSlug;
const logoUrl = import.meta.env.VITE_INSTITUTE_LOGO_URL || "/institute-logo.png";

function trackVisit(): void {
  const params = new URLSearchParams(window.location.search);
  const body = {
    pageSlug: PAGE_SLUG,
    referrer: document.referrer || undefined,
    utm_source: params.get("utm_source") || undefined,
    utm_medium: params.get("utm_medium") || undefined,
    utm_campaign: params.get("utm_campaign") || undefined,
    utm_content: params.get("utm_content") || undefined,
    utm_term: params.get("utm_term") || undefined,
  };
  const apiBase =
    typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";
  fetch(`${apiBase}/landing-analytics/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "omit",
  }).catch(() => {});
}

/** Video hero placeholder */
function VideoHeroPlaceholder() {
  return (
    <div className="lp-video-placeholder aspect-video w-full max-w-xl mx-auto">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-full bg-gradient-to-br from-violet-900/40 via-slate-800/60 to-indigo-900/40 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="inline-flex gap-2 mb-4">
              {["ChatGPT", "Copilot", "Claude"].map((t) => (
                <span
                  key={t}
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-white/80 text-xs font-medium backdrop-blur"
                >
                  {t}
                </span>
              ))}
            </div>
            <p className="text-white/60 text-sm font-medium mb-6">See what you&apos;ll build in 3 hours</p>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="lp-play-btn"
        aria-label="Watch workshop preview"
      >
        <div className="lp-play-circle">
          <Play className="w-10 h-10 text-white ml-1 fill-white" />
        </div>
      </button>
    </div>
  );
}

/** Trust logos strip */
function TrustLogosStrip() {
  const logos = [
    { alt: "Tata", src: "/logos/tata.svg" },
    { alt: "Infosys", src: "/logos/infosys.svg" },
    { alt: "Wipro", src: "/logos/wipro.svg" },
    { alt: "HCL", src: "/logos/hcl.svg" },
    { alt: "Tech Mahindra", src: "/logos/techmahindra.svg" },
    { alt: "Accenture", src: "/logos/accenture.svg" },
    { alt: "IBM", src: "/logos/ibm.svg" },
    { alt: "Microsoft", src: "/logos/microsoft.svg" },
  ];
  return (
    <div className="lp-logos-strip py-8 border-y border-white/5">
      <p className="w-full text-center text-slate-500 text-sm font-medium mb-4">
        Trusted by professionals at leading companies
      </p>
      <style>{`
        @keyframes lp-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div className="relative overflow-hidden">
        <div className="flex w-max gap-10 sm:gap-14 items-center animate-[lp-marquee_18s_linear_infinite] will-change-transform">
          {[...logos, ...logos].map((l, idx) => (
            <img
              key={`${l.alt}-${idx}`}
              src={l.src}
              alt={l.alt}
              className="h-6 sm:h-7 md:h-8 w-auto opacity-80 hover:opacity-100 transition-opacity"
              loading="lazy"
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#030712] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#030712] to-transparent" />
      </div>
    </div>
  );
}

export default function AdsCampaignLanding() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [workshopConfig, setWorkshopConfig] = useState<{
    dateLabel?: string | null;
    timeLabel?: string | null;
    modeLabel?: string | null;
  } | null>(null);
  const spotsRemaining = 47;
  // AI tools grid: first two rows sharp, last two blurred for mystery.
  const aiToolsByRow: { name: string; domain: string }[][] = [
    [
      { name: "Descript", domain: "descript.com" },
      { name: "HeyGen", domain: "heygen.com" },
      { name: "Tome", domain: "tome.app" },
      { name: "ChatGPT", domain: "openai.com" },
      { name: "D-ID", domain: "d-id.com" },
      { name: "vidyo.ai", domain: "vidyo.ai" },
    ],
    [
      { name: "Claude", domain: "anthropic.com" },
      { name: "Canva", domain: "canva.com" },
      { name: "Grammarly", domain: "grammarly.com" },
      { name: "Notion", domain: "notion.so" },
      { name: "Jasper", domain: "jasper.ai" },
      { name: "Copy.ai", domain: "copy.ai" },
    ],
    [
      { name: "Runway", domain: "runwayml.com" },
      { name: "Midjourney", domain: "midjourney.com" },
      { name: "Veed", domain: "veed.io" },
      { name: "Murf", domain: "murf.ai" },
      { name: "Synthesia", domain: "synthesia.io" },
      { name: "Lovo", domain: "lovo.ai" },
    ],
    [
      { name: "Pictory", domain: "pictory.ai" },
      { name: "Writesonic", domain: "writesonic.com" },
      { name: "Figma", domain: "figma.com" },
      { name: "Gamma", domain: "gamma.app" },
      { name: "Beautiful.ai", domain: "beautiful.ai" },
      { name: "Otter", domain: "otter.ai" },
    ],
  ];
  const navigate = useNavigate();
  const location = useLocation();

  useScrollReveal();

  useEffect(() => {
    trackVisit();
  }, []);
  const goToReservePage = () => {
    const search = location.search || "";
    navigate(`/lp/${PAGE_SLUG}/reserve${search}`);
  };

  useEffect(() => {
    // Load landing page config (date/time/mode) for hero chips
    const loadConfig = async () => {
      try {
        const res = await fetch(`/api/landing-analytics/${PAGE_SLUG}/config`, {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setWorkshopConfig(data);
        }
      } catch {
        // ignore and fall back to static config
      }
    };
    loadConfig();
  }, []);

  const faqs = [
    { q: "I'm working full-time. Will I actually be able to do this?", a: "Absolutely. This workshop is designed for working professionals. You'll learn how to use AI tools in 3 hours and apply them at your own pace." },
    { q: "Do I need any prior experience in tech or AI?", a: "Not at all. We start from zero. You'll learn ChatGPT, Copilot, and automation step by step — no coding required to begin." },
    { q: "What tools or software will I need?", a: "A laptop and internet connection. Most tools we use have free tiers. You'll get links and setup help during the session." },
    { q: "Is there any upsell or additional course after this?", a: "No upsells. No hidden costs. Pure value — everything in one session." },
    { q: "What is ChatGPT, and how can it benefit my business?", a: "ChatGPT is an AI assistant that can draft content, answer questions, and automate tasks. In this workshop you'll learn to use it (and similar tools) to save time on writing, research, and day-to-day operations — no tech background required." },
    { q: "Can I expect hands-on training and practical examples during the workshop?", a: "Yes. The session is built around live demos and hands-on exercises. You'll use real examples and leave with templates you can apply immediately at work." },
    { q: "How can ChatGPT help me save time and resources in my business operations?", a: "You'll learn to use AI for emails, reports, summaries, and repetitive tasks so you spend less time on routine work and more on high-value decisions. We cover practical workflows you can use from day one." },
    { q: "What kind of support and resources will be available to me after the workshop?", a: "You get lifetime access to the recording, prompt cheat sheets, and bonus resources. Community access is available for 30 days so you can ask follow-up questions and share with other participants." },
    { q: "How can I stay updated on future developments, workshops, and courses related to ChatGPT?", a: "We'll share follow-up resources and updates via email. You can also join our community and follow us for announcements on new workshops and AI-related content." },
    { q: "When does the workshop start?", a: "Exact date and time are shown on this page and in your confirmation email. You can also check the workshop slots displayed in the hero section above." },
    { q: "Will this be live or pre-recorded?", a: "This is a live workshop so you can ask questions and do exercises in real time. " },
    { q: "What are the timings?", a: "Timings are displayed in the hero section on this page (e.g. 10 AM–7 PM IST) and will be confirmed in your booking email. All times are in IST unless stated otherwise." },
    { q: "I have a full-time job and am not sure I can make it. Will you be sharing recordings?", a: "Yes. Everyone gets lifetime access to the full recording, so you can watch at a time that suits you and still get all the material and exercises." },
    { q: "Would there be any certificate on completion?", a: "Yes. You'll receive a certificate of completion after attending the workshop (or after watching the full recording), so you can add it to your LinkedIn and resume." },
    { q: "Do you have an affiliate program?", a: "We do run referral and affiliate programs from time to time. For current details, please reach out to us via the contact email or WhatsApp listed on this page." },
    { q: "Can I download the videos?", a: "The workshop is available to watch online live " },
    { q: "I made the payment but didn't receive any email.", a: "Check your spam and promotions folders first. If you still don't see it, email us at the contact address on this page with your name and payment reference — we'll resend your confirmation and workshop link." },
    { q: "When can I receive the bonus?", a: "Bonus materials (prompt library, templates, etc.) are shared during or right after the workshop. You'll get access via the same channel we use for the recording and resources." },
    { q: "What is the timezone?", a: "Workshop times are in IST (Indian Standard Time) unless otherwise mentioned. Your confirmation email will include the exact time and a timezone reference." },
    { q: "Who should attend this workshop?", a: "Working professionals, students, marketers, developers, managers, and analysts who want to use AI tools like ChatGPT and Copilot in their day-to-day work — no prior tech or AI experience required." },
    {q: "I made the payment but didn’t receive any email.",a:"Please write to: datauniverseonline@gmail.com and our awesome support team will get back to you in under 6 hours."}
  ];

  const stats = [
    { icon: Users, value: "10,000+", label: "Professionals Trained" },
    { icon: Star, value: "4.9/5", label: "Average Rating" },
    
  ];

  const parts = ADS_LANDING.headline.split("—");

  return (
    <div className="min-h-screen bg-[#030712] text-white antialiased overflow-x-hidden font-sans">
      {/* Sticky CTA - mobile stack, desktop row */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lp-sticky-cta lp-sticky-visible">
        <div className="bg-slate-900/98 backdrop-blur-xl border-t border-white/10 px-3 sm:px-4 py-3 sm:py-4 max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center justify-center sm:justify-start">
            <span className="text-xl sm:text-2xl font-bold text-violet-400">{ADS_LANDING.offer.price}</span>
            <span className="ml-2 text-slate-500 line-through text-sm sm:text-base">{ADS_LANDING.offer.originalPrice}</span>
          </div>
          <Button
            size="lg"
            className="w-full sm:flex-1 sm:max-w-sm h-12 sm:h-14 text-base sm:text-lg font-bold rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 text-white lp-btn-glow-violet"
            onClick={goToReservePage}
          >
            {ADS_LANDING.ctaText}
            <ArrowRight className="ml-2 h-5 w-5 shrink-0" />
          </Button>
        </div>
      </div>

      {/* Hero - full impact */}
      <section className="relative min-h-screen flex flex-col pt-28 sm:pt-32 pb-20 sm:pb-24 px-3 sm:px-4 overflow-hidden">
        <div className="lp-hero-gradient absolute inset-0" />
        <div className="lp-hero-mesh absolute inset-0" />
        <div className="lp-ai-mesh absolute inset-0" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] lp-glow-orb" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/15 rounded-full blur-[100px] lp-glow-orb" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-violet-500/10 rounded-full blur-[80px]" />

        <div className="container relative max-w-4xl mx-auto flex-1 flex flex-col items-center gap-8">
          <div className="w-full text-center">
            <div className="lp-animate-fade-up inline-flex items-center justify-center lg:justify-start gap-2 sm:gap-3 mb-6">
              <img
                src={logoUrl}
                alt={INSTITUTE_NAME}
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg border border-white/10 object-contain"
              />
              <span className="font-sans text-sm sm:text-base font-semibold text-violet-200 uppercase tracking-[0.18em]">
                AI Workshop
              </span>
            </div>
            <h1 className="lp-animate-fade-up lp-animate-fade-up-delay-1 font-sans text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.2] sm:leading-[1.25] mb-6 tracking-tight max-w-4xl mx-auto break-words">
              <span className="text-white">{parts[0]?.trim()}</span>
              {parts[1] && (
                <span className="text-white"> — <span className="text-white/90">{parts[1].trim()}</span></span>
              )}
            </h1>
            <p className="lp-animate-fade-up lp-animate-fade-up-delay-2 text-base sm:text-xl text-slate-400 max-w-3xl mx-auto mb-6 sm:mb-7 leading-relaxed">
              {ADS_LANDING.subheadline}
            </p>
            <div className="lp-animate-fade-up lp-animate-fade-up-delay-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-6">
              <Button
                size="lg"
                className="h-12 sm:h-14 px-6 text-base sm:text-lg font-bold rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 text-white shadow-lg shadow-violet-500/25 lp-btn-glow-violet"
                onClick={goToReservePage}
              >
                {ADS_LANDING.ctaText}
                <ArrowRight className="ml-2 h-5 w-5 shrink-0" />
              </Button>
              <a
                href={`https://wa.me/${CONTACT.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 sm:h-14 inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 text-base sm:text-lg font-bold text-white hover:bg-white/10 transition-colors"
              >
                Chat on WhatsApp
              </a>
            </div>
            <div className="lp-animate-fade-up lp-animate-fade-up-delay-2 mb-5 flex justify-center">
              <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-slate-900/70 shadow-xl shadow-violet-900/40 px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-300">
                    <Clock className="h-4 w-4" />
                    3-Hour Live Workshop
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs sm:text-sm text-violet-200">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    4.9/5 rating
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-2xl sm:text-3xl font-extrabold text-emerald-300">₹99</span>
                  <span className="text-xs sm:text-sm text-slate-500 line-through">₹2,499</span>
                  <span className="text-[10px] sm:text-xs text-emerald-300 font-semibold uppercase tracking-[0.15em]">
                    Limited-time offer
                  </span>
                </div>
                <ul className="space-y-1.5 text-xs sm:text-sm text-slate-200 mb-4">
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-300 mt-0.5 shrink-0" />
                    <span>Learn 25+ real-world AI tools you can use at work the next day.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-300 mt-0.5 shrink-0" />
                    <span>Perfect for working professionals and students — no coding required.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-300 mt-0.5 shrink-0" />
                    <span>Get bonuses worth ₹4,995: prompt library, templates and AI toolkits.</span>
                  </li>
                </ul>
                <p className="text-[11px] sm:text-xs text-slate-400">
                  Join from anywhere on your laptop — recording included if you can&apos;t attend live.
                </p>
              </div>
            </div>
            {/* Workshop slots */}
            {(workshopConfig?.dateLabel || workshopConfig?.timeLabel || workshopConfig?.modeLabel) && (
              <div className="lp-animate-fade-up lp-animate-fade-up-delay-3 mb-6 space-y-2">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {workshopConfig?.dateLabel && (
                    <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/15 px-3 py-1.5 text-xs sm:text-sm">
                      <Calendar className="h-3.5 w-3.5 text-violet-300 shrink-0" />
                      <span className="font-semibold text-white">{workshopConfig.dateLabel}</span>
                    </div>
                  )}
                  {workshopConfig?.timeLabel && (
                    <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/15 px-3 py-1.5 text-xs sm:text-sm">
                      <Clock className="h-3.5 w-3.5 text-violet-300 shrink-0" />
                      <span className="text-slate-200">{workshopConfig.timeLabel}</span>
                    </div>
                  )}
                  {workshopConfig?.modeLabel && (
                    <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-400/30 px-3 py-1.5 text-xs sm:text-sm">
                      <Play className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
                      <span className="text-emerald-100 font-medium">{workshopConfig.modeLabel}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Spots remaining bar */}
            <div className="lp-animate-fade-up lp-animate-fade-up-delay-3 max-w-md mx-auto lg:mx-0 mb-8">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-violet-400 font-semibold">Limited seats</span>
                <span className="text-slate-400">{spotsRemaining} spots left</span>
              </div>
              <div className="lp-spots-bar">
                <div className="lp-spots-fill" style={{ width: `${spotsRemaining}%` }} />
              </div>
            </div>

            <div className="lp-animate-fade-up lp-animate-fade-up-delay-3 flex flex-wrap justify-center lg:justify-start gap-4 sm:gap-8 mb-8 sm:mb-10">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <s.icon className="h-5 w-5 sm:h-6 sm:w-6 text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <span className="block font-bold text-white text-base sm:text-lg">{s.value}</span>
                    <span className="text-slate-500 text-xs sm:text-sm">{s.label}</span>
                  </div>
                </div>
              ))}
            </div>

         
          </div>

        </div>

        {/* Trust logos strip */}
        <div className="container max-w-6xl mx-auto relative">
          <TrustLogosStrip />
        </div>
      </section>

      {/* (Old workshop details section removed – info now lives under hero image) */}

      {/* Bonuses section - dark cards, on-brand gradient */}
      <section className="py-14 sm:py-24 px-3 sm:px-4 border-t border-white/5">
        <div className="container max-w-5xl">
          <h2 className="lp-reveal font-sans text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.2] text-center mb-2">
            Free Bonuses Worth ₹5000
          </h2>
          <p className="lp-reveal text-violet-200 text-center text-sm sm:text-base mb-10">
            Included with your workshop seat at no extra cost
          </p>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
            {[
              {
                title: "AI Prompt Library (Worth ₹999)",
              },
              {
                title: "AI Tools Master List (Worth ₹999)",
              },
              {
                title: "AI for Work Templates (Worth ₹1499)",
              },
              {
                title: "AI Resource Toolkit (Worth ₹1499)",
              },
            ].map((bonus, idx) => (
              <div
                key={bonus.title}
                className="lp-reveal rounded-2xl bg-gradient-to-br from-violet-500/15 via-indigo-500/10 to-slate-900/80 border border-violet-400/30 px-4 py-4 sm:px-5 sm:py-5 shadow-lg shadow-violet-900/30 flex gap-3"
              >
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-violet-500 text-slate-950 font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-sm sm:text-base text-emerald-100">
                    {bonus.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="lp-reveal text-center text-sm sm:text-base font-semibold text-violet-200">
            ⭐ Total bonus value: ₹4,995 — You pay only ₹99 for the workshop
          </p>
        </div>
      </section>

      {/* AI tools logos strip: rows 1–2 clear, rows 3–4 blurred */}
      <section className="pt-0 pb-10 sm:pt-2 sm:pb-16 px-3 sm:px-4 bg-gradient-to-b from-[#030712] via-slate-900/70 to-[#030712] border-t border-white/5">
        <div className="container max-w-5xl">
      
          <h2 className="lp-reveal font-sans text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-[1.2] text-center text-white mb-8">
          25+ AI Tools used by Professionals
          </h2>
          <div className="lp-reveal space-y-4">
            {aiToolsByRow.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 ${
                  rowIndex >= 2 ? "select-none pointer-events-none blur-md opacity-80" : ""
                }`}
              >
                {row.map((tool) => (
                  <div
                    key={`${tool.domain}-${tool.name}`}
                    className="flex items-center gap-2 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 bg-white/5 border border-white/10"
                  >
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-violet-500/30 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {tool.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-xs sm:text-sm text-white truncate">
                      {tool.name}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video / learning outcomes - standout */}
      <section className="py-14 sm:py-24 px-3 sm:px-4 bg-gradient-to-b from-slate-900/50 to-[#030712] border-t border-white/5">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="lp-reveal font-sans text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.2] text-white mb-4">
              What You&apos;ll Learn in 3 Hours
            </h2>
          </div>

          <div className="lp-reveal grid gap-3 sm:gap-4">
            {[
              {
                title: "Understand How AI Works in the Real World",
                details:
                  "Learn the fundamentals of AI and how companies are using it to increase productivity, reduce manual work and create new opportunities.",
                Icon: Sparkles,
              },
              {
                title: "Use 20+ Powerful AI Tools",
                details:
                  "Get hands-on with popular tools for writing, research, presentations, coding and automation so you know exactly what to use for which task.",
                Icon: BadgeCheck,
              },
              {
                title: "Automate Daily Work Tasks",
                details:
                  "See how to automate emails, reports, data analysis and repetitive tasks so that AI handles the boring work while you focus on thinking.",
                Icon: Zap,
              },
              {
                title: "Save 5–10 Hours Every Week",
                details:
                  "Discover ready-made AI workflows that help professionals finish tasks faster and free up evenings and weekends.",
                Icon: Clock,
              },
              {
                title: "Write Powerful AI Prompts",
                details:
                  "Master the basics of prompt engineering so your AI tools return accurate, high-quality outputs instead of random text.",
                Icon: Quote,
              },
              {
                title: "Create Reports, Presentations & Documents in Minutes",
                details:
                  "Learn how to generate polished decks, documents and summaries with AI instead of spending hours building them from scratch.",
                Icon: Gift,
              },
              {
                title: "Use AI for Data Analysis & Decision Making",
                details:
                  "Use AI to quickly analyze data, surface patterns and generate insights that support smarter business decisions.",
                Icon: Users,
              },
              {
                title: "Improve Productivity by 10X",
                details:
                  "Build a personal AI stack that helps you work smarter — drafting, editing, planning and ideating with far less effort.",
                Icon: TrendingUp,
              },
              {
                title: "Build Simple AI Automations",
                details:
                  "Create basic automations that connect your tools together so data moves automatically and repetitive tasks run on autopilot.",
                Icon: Check,
              },
              {
                title: "Stay Future-Ready in the AI Era",
                details:
                  "Understand how AI is changing roles and what you can do now to stay relevant, valuable and ahead of the curve in your career.",
                Icon: Target,
              },
            ].map((item) => (
              <details
                key={item.title}
                className="group rounded-xl sm:rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 sm:px-5 sm:py-4 text-left transition-colors open:bg-slate-900"
              >
                <summary className="flex items-center justify-between gap-3 cursor-pointer list-none">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15">
                      <item.Icon className="h-4 w-4 text-emerald-300" />
                    </span>
                    <span className="font-semibold text-sm sm:text-base text-white">
                      {item.title}
                    </span>
                  </div>
                  <span className="ml-auto text-xs text-slate-400 group-open:hidden">Tap to see more</span>
                  <span className="ml-auto text-xs text-slate-400 hidden group-open:inline">Tap to hide</span>
                </summary>
                <div className="mt-2 pl-7 sm:pl-8 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {item.details}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Who is this for - dark stacked list */}
      {ADS_LANDING.whoIsThisFor && (
        <section className="py-14 sm:py-24 px-3 sm:px-4 bg-gradient-to-b from-slate-900 to-[#030712] text-white border-t border-white/5">
          <div className="container max-w-4xl">
            <h2 className="lp-reveal font-sans text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.2] text-center mb-4">
              Who Is This For?
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {ADS_LANDING.whoIsThisFor.map((item) => (
                <div
                  key={item.role}
                  className="lp-reveal flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 sm:px-5 sm:py-4"
                >
                  <div className="mt-1 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-violet-500/25">
                    <Target className="h-4 w-4 sm:h-5 sm:w-5 text-violet-200" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-white mb-1">{item.role}</p>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

 


      {/* Testimonials - video carousel auto-scroll marquee */}
      <section className="py-16 sm:py-24 px-4 border-t border-white/5 bg-gradient-to-b from-slate-900/60 to-[#030712] flex items-center">
        <div className="container max-w-5xl">
          <p className="lp-reveal text-violet-400 font-semibold text-sm uppercase tracking-wider text-center mb-3">
            Success stories
          </p>
          <h2 className="lp-reveal font-sans text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.2] text-center mb-4">
            What Others Are Saying
          </h2>
          <p className="lp-reveal text-slate-400 text-center text-sm sm:text-base mb-8">
            Watch real professionals and students share how this workshop changed the way they work with AI.
          </p>
          <style>{`
            @keyframes lp-video-marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
          <div className="lp-reveal relative overflow-hidden">
            <div className="flex w-max gap-4 sm:gap-6 will-change-transform animate-[lp-video-marquee_45s_linear_infinite]">
              {[
                { label: "Review 1", src: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
                { label: "Review 2", src: "https://www.youtube.com/embed/ysz5P6Q8GJY" },
                { label: "Review 3", src: "https://www.youtube.com/embed/3fumBcKC6RE" },
                { label: "Review 4", src: "https://www.youtube.com/embed/lTTajzrSkCw" },
                { label: "Review 5", src: "https://www.youtube.com/embed/ScMzIvxBSi4" },
                { label: "Review 6", src: "https://www.youtube.com/embed/oUFJJNQGwhk" },
              ]
                .flatMap((row) => [row, row])
                .map((video, i) => (
                  <div
                    key={`${video.label}-${i}`}
                    className="shrink-0 w-[260px] sm:w-[280px] md:w-[300px] rounded-2xl border border-white/10 bg-slate-900/80 overflow-hidden shadow-xl shadow-black/40"
                  >
                    <div className="relative aspect-video bg-slate-950/80 flex items-center justify-center">
                      <iframe
                        src={video.src}
                        title={video.label}
                        className="h-full w-full"
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                    <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{video.label}</p>
                        <p className="text-xs text-slate-400">AI Workshop Participant</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                        <Star className="h-4 w-4 fill-emerald-300 text-emerald-300" />
                        5.0
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <p className="lp-reveal text-center text-xs sm:text-sm text-slate-500 mt-4">
            You can replace these sample YouTube links with your own review videos later.
          </p>
        </div>
      </section>

  

      {/* Transformation - glass panel with gradient accents */}
      <section className="py-16 sm:py-20 px-3 sm:px-4 border-t border-white/5 bg-gradient-to-b from-[#030712] via-slate-900/70 to-[#030712]">
        <div className="container max-w-4xl">
          <p className="lp-reveal text-violet-400 font-semibold text-sm uppercase tracking-[0.2em] text-center mb-3">
            Your future
          </p>
          <h2 className="lp-reveal font-sans text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.15] text-center mb-4">
            Imagine This in a Few Weeks…
          </h2>
          <p className="lp-reveal text-center text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mb-8">
            Real changes people see after applying what they learn in the workshop.
          </p>
          <div className="lp-reveal max-w-2xl mx-auto rounded-3xl border border-white/10 bg-slate-900/60 shadow-2xl shadow-black/50 overflow-hidden">
            <div className="p-4 sm:p-6 space-y-0 divide-y divide-white/5">
              {ADS_LANDING.transformation.map((t) => (
                <div
                  key={t}
                  className="flex items-center gap-4 py-4 sm:py-5 first:pt-0 last:pb-0"
                >
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/90 to-indigo-500/90 text-white shadow-lg shadow-violet-500/25">
                    <Check className="h-5 w-5 sm:h-5 sm:w-5" strokeWidth={2.5} />
                  </div>
                  <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-medium">
                    {t}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* FAQ */}
      <section className="py-14 sm:py-24 px-3 sm:px-4 pb-28 sm:pb-24 border-t border-white/5">
        <div className="container max-w-4xl">
          <h2 className="lp-reveal lp-font-display text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3 max-w-2xl mx-auto">
            {faqs.map((f, i) => (
              <div key={i} className="lp-reveal rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden hover:border-violet-500/20 transition-colors">
                <button
                  className="w-full flex items-center justify-between p-5 text-left font-medium text-white hover:bg-white/5 transition-colors"
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                >
                  {f.q}
                  {faqOpen === i ? <ChevronUp className="h-5 w-5 text-violet-400 shrink-0" /> : <ChevronDown className="h-5 w-5 text-violet-400 shrink-0" />}
                </button>
                {faqOpen === i && <div className="px-5 pb-5 text-slate-400">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 sm:py-16 px-4 border-t border-white/10 bg-slate-900/50">
        <div className="container max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center gap-6 sm:gap-8">
            <div className="flex items-center gap-3">
              <img
                src={logoUrl}
                alt={INSTITUTE_NAME}
                className="h-10 w-10 rounded-lg border border-white/10 object-contain"
              />
              <span className="font-sans font-bold text-lg text-white">{INSTITUTE_NAME}</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md">
              {CONTACT.address}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs sm:text-sm text-slate-500">
              <span>Registered name: <strong className="text-slate-300">A S Upskill Academy</strong></span>
              <span>GST: <strong className="text-slate-300">27ACCFA9428L1Z1</strong></span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm">
              <a href="/pdfs/terms.pdf" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-violet-400 transition-colors">
                Terms &amp; Conditions
              </a>
              <a href="/pdfs/privacy.pdf" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-violet-400 transition-colors">
                Privacy Policy
              </a>
              <a href="/pdfs/refund.pdf" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-violet-400 transition-colors">
                Refund Policy
              </a>
            </div>
            <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
              <a href={`mailto:${CONTACT.email}`} className="hover:text-violet-400 transition-colors">{CONTACT.email}</a>
              <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-violet-400 transition-colors">WhatsApp</a>
              <Link to="/" className="text-slate-400 hover:text-violet-400 transition-colors font-medium">Back to Home</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
