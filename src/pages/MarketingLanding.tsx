import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  BookOpen,
  GraduationCap,
  Award,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Download,
  Calendar,
  Users,
  Briefcase,
  Star,
  Quote,
  Play,
  Building2,
  Target,
  Eye,
  Menu,
  UserCircle,
} from "lucide-react";
import {
  INSTITUTE_NAME,
  CONTACT,
  HERO,
  STATS,
  COURSES,
  INSTITUTE_STORY,
  FACULTY,
  PLACEMENTS,
  PLACEMENT_VIDEOS,
  MARKETING_VIDEOS,
  TESTIMONIALS,
  GOOGLE_REVIEW_STATS,
} from "@/config/marketing";
import { toast } from "@/hooks/use-toast";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const whatsappUrl = `https://wa.me/${CONTACT.whatsapp}`;
const logoUrl = import.meta.env.VITE_INSTITUTE_LOGO_URL || "/institute-logo.png";

function Logo({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <img
      src={logoUrl}
      alt={INSTITUTE_NAME}
      className={className}
      width={size}
      height={size}
    />
  );
}

/** Renders a video card: iframe if embedUrl, else a link card. */
function VideoCard({
  title,
  description,
  embedUrl,
  url,
  className = "",
}: {
  title: string;
  description?: string;
  embedUrl?: string;
  url?: string;
  className?: string;
}) {
  const hasLink = !!(url || embedUrl);
  if (embedUrl) {
    return (
      <div className={`rounded-2xl border-2 border-border/60 bg-muted/30 overflow-hidden shadow-md ${className}`}>
        <div className="aspect-video w-full bg-black/5">
          <iframe
            src={embedUrl}
            title={title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="p-4">
          <p className="font-semibold text-foreground">{title}</p>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      </div>
    );
  }
  const content = (
    <>
      <div className="aspect-video w-full bg-muted/50 flex items-center justify-center">
        <div className="text-center p-4">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Play className="h-7 w-7 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">{hasLink ? "Watch video" : "Add video URL in config"}</p>
        </div>
      </div>
      <div className="p-4">
        <p className="font-semibold text-foreground">{title}</p>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
    </>
  );
  if (hasLink && url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`block rounded-2xl border-2 border-border/60 bg-muted/30 overflow-hidden shadow-md hover:shadow-lg hover:border-primary/30 transition-all ${className}`}
      >
        {content}
      </a>
    );
  }
  return (
    <div className={`rounded-2xl border-2 border-dashed border-border/60 bg-muted/30 overflow-hidden ${className}`}>
      {content}
    </div>
  );
}

const navLinks = [
  { label: "Courses", href: "#courses" },
  { label: "About", href: "#about" },
  { label: "Videos", href: "#videos" },
  { label: "Placements", href: "#placements" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];

export default function MarketingLanding() {
  useScrollReveal();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    bookDemo: false,
    downloadBrochure: false,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    const apiBase = typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";
    try {
      const res = await fetch(`${apiBase}/landing-analytics/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          message: formData.message.trim(),
          bookDemo: formData.bookDemo,
          downloadBrochure: formData.downloadBrochure,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ variant: "destructive", title: "Submission failed", description: data.error || "Please try again." });
        return;
      }
      setFormData({ name: "", email: "", phone: "", message: "", bookDemo: false, downloadBrochure: false });
      toast({ title: "Enquiry received", description: data.message || "We'll get back to you within 24 hours." });
    } catch {
      toast({ variant: "destructive", title: "Submission failed", description: "Please try again." });
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background antialiased overflow-x-hidden">
      {/* ----- Header ----- */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-900/70 backdrop-blur-xl shadow-sm">
        {/* Row 1: Logo + Nav (desktop) / Logo + Menu (mobile) */}
        <div className="container flex h-14 md:h-16 items-center justify-between gap-2 px-3 sm:px-4">
          <Link to="/" className="flex items-center gap-2 lp-font-display font-bold text-base sm:text-lg text-white shrink-0 min-w-0">
            <Logo size={32} className="h-8 w-8 sm:h-9 sm:w-9 object-contain shrink-0" />
            <span className="truncate">{INSTITUTE_NAME}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ label, href }) => (
              <button
                key={href}
                onClick={() => scrollTo(href.slice(1))}
                className="px-3 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 text-white hover:bg-white/10 shrink-0 order-first md:order-none" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] bg-slate-900 border-slate-700">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-700">
                  <Logo size={32} className="h-8 w-8 object-contain" />
                  <span className="lp-font-display font-semibold text-foreground">{INSTITUTE_NAME}</span>
                </div>
                <nav className="flex flex-col gap-2 pt-6">
                  {navLinks.map(({ label, href }) => (
                    <button key={href} onClick={() => { scrollTo(href.slice(1)); setMobileMenuOpen(false); }} className="text-left px-3 py-2 text-sm font-medium text-foreground rounded-md hover:bg-muted">{label}</button>
                  ))}
                  <div className="border-t border-slate-700 pt-4 mt-4 flex flex-col gap-2">
                    <Button size="sm" className="w-full bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 text-white" onClick={() => { scrollTo("contact"); setMobileMenuOpen(false); }}>Book Demo</Button>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)}><Button size="sm" className="w-full bg-primary">Apply Now</Button></Link>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}><Button size="sm" variant="outline" className="w-full">Login</Button></Link>
                  </div>
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="pt-2">
                    <Button variant="outline" size="sm" className="w-full text-green-400 border-green-500/30 hover:bg-green-500/10"><MessageCircle className="h-4 w-4 mr-2" /> WhatsApp</Button>
                  </a>
                </nav>
              </SheetContent>
            </Sheet>
            {/* WhatsApp icon (desktop) - CTAs moved to hero */}
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="hidden md:inline-flex shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-500/20">
                <MessageCircle className="h-5 w-5" />
              </Button>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ----- Hero ----- */}
        <section className="relative overflow-hidden min-h-[80vh] sm:min-h-[90vh] flex items-center">
          <div className="lp-hero-gradient absolute inset-0" />
          <div className="lp-ai-mesh absolute inset-0" />
          <div className="marketing-hero-pattern absolute inset-0" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/15 rounded-full blur-[80px]" />
          <div className="container relative py-12 sm:py-16 md:py-28 lg:py-32 px-4 sm:px-6">
            <div className="mx-auto max-w-4xl text-center space-y-10">
              {/* Login, Book Demo, Apply Now - centered in hero above logo (all screen sizes) */}
              <div className="lp-reveal flex flex-wrap items-center justify-center gap-2 sm:gap-3 pb-4">
                <Link to="/login">
                  <Button size="sm" variant="ghost" className="h-9 sm:h-10 px-3 sm:px-4 text-sm text-white/90 hover:text-white hover:bg-white/10">
                    Login
                  </Button>
                </Link>
                <Button size="sm" onClick={() => scrollTo("contact")} className="h-9 sm:h-10 px-3 sm:px-4 text-sm gap-1.5 border border-white/30 text-white hover:bg-white/10">
                  Book Demo
                </Button>
                <Link to="/register">
                  <Button size="sm" className="h-9 sm:h-10 px-3 sm:px-4 text-sm gap-1.5 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 text-white">
                    Apply Now
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </Link>
              </div>
              {/* <div className="lp-reveal">
                <Logo size={56} className="mx-auto h-14 w-14 object-contain drop-shadow-sm" />
              </div> */}
              {/* <div className="lp-reveal">
                <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium bg-white/10 border border-white/20 text-white">
                  <Award className="h-4 w-4 text-amber-400" />
                  Trusted by 45K+ learners
                </span>
              </div> */}
            <h1 className="lp-reveal font-sans text-3xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl leading-[1.15] drop-shadow-sm max-w-4xl mx-auto px-1 break-words whitespace-pre-line">
  {HERO.headline}
</h1>
<p className="lp-reveal text-lg text-white/85 md:text-xl max-w-2xl mx-auto whitespace-pre-line">
  {HERO.subheadline}
</p>
              {/* Stats - glass cards */}
              <div className="lp-reveal grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 py-6 sm:py-8">
                {STATS.map(({ value, label }) => (
                  <div key={label} className="rounded-xl sm:rounded-2xl px-3 py-3 sm:px-6 sm:py-5 text-center bg-white/5 backdrop-blur border border-white/10">
                    <div className="lp-font-display text-2xl md:text-3xl font-bold text-white">{value}</div>
                    <div className="text-xs sm:text-sm text-white/70 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
              {/* CTAs - responsive sizing for mobile */}
              <div className="lp-reveal flex flex-wrap items-center justify-center gap-2 sm:gap-3">
  
  <Button
    size="lg"
    onClick={() => scrollTo("contact")}
    className="h-10 sm:h-11 gap-2 text-sm sm:text-base bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 text-white shadow-lg"
  >
    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
    Book Demo
  </Button>

  <Link to="/register">
    <Button
      size="lg"
      className="h-10 sm:h-11 gap-2 text-sm sm:text-base bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 text-white shadow-lg"
    >
      Apply Now
      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
    </Button>
  </Link>

  {HERO.ctaDownloadBrochure && (
    <Button
      size="lg"
      className="h-10 sm:h-11 gap-2 text-sm sm:text-base bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 text-white shadow-lg"
      onClick={() =>
        toast({
          title: "Brochure",
          description: "We'll email you the brochure.",
        })
      }
    >
      <Download className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
      <span className="hidden sm:inline">Download Brochure</span>
      <span className="sm:hidden">Brochure</span>
    </Button>
  )}

  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
    <Button
      size="lg"
      className="h-10 sm:h-11 gap-2 text-sm sm:text-base bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 text-white shadow-lg"
    >
      <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
      WhatsApp
    </Button>
  </a>
</div>
            </div>
          </div>
        </section>

        {/* ----- Courses ----- */}
        <section id="courses" className="scroll-mt-20 py-14 sm:py-20 md:py-28 marketing-section-accent">
          <div className="container px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="lp-reveal lp-font-display text-3xl font-bold text-foreground md:text-4xl marketing-title-underline">Courses We Offer</h2>
              <p className="mt-6 text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">Duration, fees, syllabus overview, tools, and career outcomes.</p>
            </div>
            <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
              {COURSES.map((course, i) => (
                <Card key={course.title} className={`marketing-course-card marketing-card-hover overflow-hidden border-2 border-border/60 bg-card shadow-lg hover:border-primary/20 ${i === 1 ? "lg:-mt-4" : ""}`}>
                  <CardHeader className="pb-3">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl">{course.title}</CardTitle>
                    <CardDescription className="flex flex-wrap gap-2 mt-2">
                      <span className="inline-flex items-center gap-1"><BookOpen className="h-4 w-4" /> {course.duration}</span>
                      <span className="font-semibold text-foreground">{course.fees}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p><span className="font-medium text-foreground">Tools:</span> {course.tools.join(", ")}</p>
                    <p><span className="font-medium text-foreground">Career outcomes:</span> {course.outcomes}</p>
                    {course.demoClass && (
                      <p className="text-primary font-semibold flex items-center gap-1">Free demo class available</p>
                    )}
                  </CardContent>
                  <CardFooter className="flex gap-2 flex-wrap pt-2">
                    <Button size="sm" variant="outline" onClick={() => scrollTo("contact")}>Book demo class</Button>
                    <Link to="/register"><Button size="sm" className="bg-primary">Apply now</Button></Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ----- Institute Story ----- */}
        <section id="about" className="scroll-mt-20 py-14 sm:py-20 md:py-28 border-t border-border/60 bg-gradient-to-b from-background to-muted/40">
          <div className="container px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-20 items-start">
              <div className="space-y-8">
                <div>
                  <h2 className="lp-reveal lp-font-display text-3xl font-bold text-foreground md:text-4xl marketing-title-underline">Our Story</h2>
                  <p className="mt-6 text-muted-foreground">Mission, vision, and experience.</p>
                </div>
                <div className="space-y-6">
                  <div className="flex gap-4 p-4 rounded-2xl bg-card border border-border/60 shadow-sm">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Mission</h3>
                      <p className="text-sm text-muted-foreground mt-1">{INSTITUTE_STORY.mission}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-4 rounded-2xl bg-card border border-border/60 shadow-sm">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                      <Eye className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Vision</h3>
                      <p className="text-sm text-muted-foreground mt-1">{INSTITUTE_STORY.vision}</p>
                    </div>
                  </div>
                </div>
                {/* <div className="flex flex-wrap gap-6 items-start">
                  <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 px-6 py-4 text-primary-foreground shadow-lg">
                    <span className="font-display text-3xl font-bold">{INSTITUTE_STORY.yearsExperience}+</span>
                    <span className="ml-1 opacity-90">years</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Achievements</p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5">{INSTITUTE_STORY.achievements.map((a) => <li key={a}>{a}</li>)}</ul>
                  </div>
                </div> */}
                {/* <div className="text-sm text-muted-foreground space-y-2 p-4 rounded-xl bg-muted/50 border border-border/60">
                  <p><span className="font-semibold text-foreground">Certifications:</span> {INSTITUTE_STORY.certifications.join("; ")}</p>
                  <p><span className="font-semibold text-foreground">Affiliations:</span> {INSTITUTE_STORY.affiliations.join("; ")}</p>
                </div> */}
              </div>
              <div className="rounded-2xl border-2 border-border/60 bg-muted/30 aspect-[4/3] flex items-center justify-center overflow-hidden shadow-xl">
                <div className="text-center p-8 text-muted-foreground">
                  <Building2 className="h-20 w-20 mx-auto mb-4 opacity-40" />
                  <p className="text-sm font-medium">Campus / classroom photos</p>
                  <p className="text-xs mt-1">Add your images here</p>
                </div>
              </div>
            </div>
            {/* Faculty highlights */}
            <div className="mt-20 pt-20 border-t-2 border-border/60">
              <h3 className="font-display text-2xl font-bold text-foreground mb-8 text-center marketing-title-underline">Faculty Highlights</h3>
              <div className="grid sm:grid-cols-3 gap-8">
                {FACULTY.map((f, i) => (
                  <Card key={`faculty-${i}-${f.name}`} className="marketing-card-hover border-2 border-border/60 text-center overflow-hidden shadow-md hover:shadow-xl">
                    <CardContent className="pt-8 pb-6">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 ring-2 ring-primary/20">
                        <UserCircle className="h-9 w-9 text-primary" />
                      </div>
                      <p className="font-bold text-foreground text-lg">{f.name}</p>
                      <p className="text-sm font-medium text-primary">{f.role}</p>
                      <p className="text-sm text-muted-foreground mt-2">{f.bio}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ----- Placements ----- */}
        <section id="placements" className="scroll-mt-20 py-14 sm:py-20 md:py-28 marketing-section-accent border-t border-border/60">
          <div className="container px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="lp-reveal lp-font-display text-3xl font-bold text-foreground md:text-4xl marketing-title-underline">Student Placements</h2>
              <p className="mt-6 text-muted-foreground text-base md:text-lg">Companies, packages, and outcomes.</p>
            </div>
            <div className="rounded-2xl sm:rounded-3xl border-2 border-border/60 bg-card p-5 sm:p-8 md:p-14 shadow-xl overflow-hidden">
              <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
                <div className="space-y-8">
                  <div className="inline-block rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 border border-primary/20 px-6 py-4">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Average package</p>
                    <p className="font-display text-4xl font-bold marketing-gradient-text">{PLACEMENTS.avgPackage}</p>
                  </div>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    {PLACEMENTS.internshipStat}
                  </p>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-3">Our Students Placed In </p>
                    <div className="flex flex-wrap gap-2 justify-center">
  {PLACEMENTS.companies.map((c) => (
    <span
      key={c}
      className="rounded-lg bg-primary/10 text-primary font-medium px-3 py-1.5 text-xs sm:text-sm border border-primary/20"
    >
      {c}
    </span>
  ))}
</div>
                  </div>
                </div>
                <div className="space-y-4">
                    <p className="text-sm font-semibold text-foreground">Placement & success story videos</p>
                    <div className={`grid gap-4 ${PLACEMENT_VIDEOS.length >= 3 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                      {PLACEMENT_VIDEOS.map((v) => (
                        <VideoCard key={v.id} title={v.title} embedUrl={v.embedUrl} url={v.url} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </section>

        {/* ----- Institute videos (marketing / institute info) ----- */}
          {/* {MARKETING_VIDEOS.length > 0 && (
            <section id="videos" className="scroll-mt-20 py-14 sm:py-20 md:py-28 border-t border-border/60 bg-gradient-to-b from-background to-muted/30">
              <div className="container px-4 sm:px-6">
                <div className="text-center mb-16">
                  <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl marketing-title-underline">Institute in action</h2>
                  <p className="mt-6 text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">Watch our campus, programs, and what makes us different.</p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {MARKETING_VIDEOS.map((v) => (
                    <VideoCard key={v.id} title={v.title} description={v.description} embedUrl={v.embedUrl} url={v.url} className="marketing-card-hover" />
                  ))}
                </div>
              </div>
            </section>
          )} */}

        {/* ----- Testimonials ----- */}
        <section id="testimonials" className="scroll-mt-20 py-14 sm:py-20 md:py-28 border-t border-border/60 bg-gradient-to-b from-background to-muted/30">
          <div className="container px-4 sm:px-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 sm:mb-16">
              <div>
                <h2 className="lp-reveal lp-font-display text-3xl font-bold text-foreground md:text-4xl marketing-title-underline">Testimonials & Reviews</h2>
                <p className="mt-6 text-muted-foreground text-base">What students and parents say.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-amber-200/60 bg-amber-50/80 dark:bg-amber-950/20 px-4 sm:px-5 py-3 sm:py-4 w-full sm:w-fit shadow-sm">
                <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
                <span className="font-display text-2xl font-bold text-foreground">{GOOGLE_REVIEW_STATS.rating}</span>
                <span className="text-muted-foreground text-sm">Google · {GOOGLE_REVIEW_STATS.count}+ reviews</span>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {TESTIMONIALS.map((t, i) => (
                <Card key={`testimonial-${i}-${t.name}`} className="marketing-card-hover marketing-quote-border border-2 border-border/60 bg-card shadow-md pl-6">
                  <CardContent className="pt-6 pb-6">
                    <Quote className="h-10 w-10 text-primary/20 mb-3" />
                    <p className="text-muted-foreground mb-5 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-0.5">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="font-semibold text-foreground">{t.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{t.role}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            {PLACEMENT_VIDEOS.length > 0 && (
              <div className="mt-14">
                <h3 className="font-display text-xl font-semibold text-foreground mb-6 text-center">Video testimonials</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {PLACEMENT_VIDEOS.map((v) => (
                    <VideoCard key={v.id} title={v.title} embedUrl={v.embedUrl} url={v.url} className="marketing-card-hover" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ----- Contact / Enquiry ----- */}
        <section id="contact" className="scroll-mt-20 py-14 sm:py-20 md:py-28 marketing-section-accent border-t border-border/60">
          <div className="container px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="lp-reveal lp-font-display text-3xl font-bold text-foreground md:text-4xl marketing-title-underline">Contact & Enquiry</h2>
              <p className="mt-6 text-muted-foreground text-base md:text-lg">Reach out or book a demo. We respond quickly.</p>
            </div>
            <div className="grid lg:grid-cols-2 gap-0 overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-border/60 shadow-2xl">
              <div className="marketing-contact-panel p-5 sm:p-8 md:p-12 flex flex-col justify-center space-y-6 sm:space-y-8">
                <div>
                  <div className="mb-3 inline-flex rounded-xl bg-white/20 p-2">
                    <Logo size={40} className="h-10 w-10 object-contain" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-white mb-2">Get in touch</h3>
                  <p className="text-white/80">Phone, WhatsApp, email, or visit us.</p>
                </div>
                <div className="space-y-6">
                  <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} className="flex items-center gap-4 text-white hover:text-white/90 transition-colors">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15"><Phone className="h-7 w-7" /></div>
                    <div>
                      <p className="text-xs text-white/70 uppercase tracking-wide">Phone</p>
                      <p className="font-semibold text-lg">{CONTACT.phone}</p>
                    </div>
                  </a>
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-white hover:text-white/90 transition-colors">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/30"><MessageCircle className="h-7 w-7" /></div>
                    <div>
                      <p className="text-xs text-white/70 uppercase tracking-wide">WhatsApp</p>
                      <p className="font-semibold text-lg">Chat with us</p>
                    </div>
                  </a>
                  <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-4 text-white hover:text-white/90 transition-colors">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15"><Mail className="h-7 w-7" /></div>
                    <div>
                      <p className="text-xs text-white/70 uppercase tracking-wide">Email</p>
                      <p className="font-semibold text-lg break-all">{CONTACT.email}</p>
                    </div>
                  </a>
                </div>
                <div className="flex items-start gap-3 text-white/90">
                  <MapPin className="h-5 w-5 shrink-0 mt-0.5" />
                  <p className="text-sm">{CONTACT.address}</p>
                </div>
                {CONTACT.mapEmbedUrl ? (
                  <div className="rounded-xl overflow-hidden border border-white/20 aspect-video">
                    <iframe src={CONTACT.mapEmbedUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Map" />
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/20 bg-white/5 aspect-video flex items-center justify-center text-white/60 text-sm">
                    Add map embed URL in config
                  </div>
                )}
              </div>
              <Card className="rounded-none border-0 border-t-2 lg:border-t-0 lg:border-l-2 border-border/60 shadow-xl bg-card">
                <CardHeader className="p-5 sm:p-8 pb-4">
                  <CardTitle className="text-xl">Enquiry / Book Demo</CardTitle>
                  <CardDescription className="text-base">Fill the form and we’ll get back within 24 hours. Tick to book a free demo or request brochure.</CardDescription>
                </CardHeader>
                <CardContent className="p-5 sm:p-8 pt-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" placeholder="Your name" value={formData.name} onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" type="tel" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData((d) => ({ ...d, phone: e.target.value }))} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea id="message" placeholder="Your message or query" rows={4} value={formData.message} onChange={(e) => setFormData((d) => ({ ...d, message: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox checked={formData.bookDemo} onCheckedChange={(c) => setFormData((d) => ({ ...d, bookDemo: !!c }))} />
                        <span className="text-sm">Book a free demo class</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox checked={formData.downloadBrochure} onCheckedChange={(c) => setFormData((d) => ({ ...d, downloadBrochure: !!c }))} />
                        <span className="text-sm">Send me the brochure (PDF)</span>
                      </label>
                    </div>
                    <Button type="submit" className="w-full" disabled={formSubmitting}>
                      {formSubmitting ? "Sending..." : "Submit Enquiry"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
            {/* Lead capture CTAs */}
            <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

{/* Terms & Conditions */}
<Button
  variant="outline"
  className="h-auto py-5 flex flex-col items-center gap-2 rounded-xl border-2 hover:border-primary/40 hover:bg-primary/5 transition-colors"
  onClick={() => window.open("/pdfs/terms.pdf")}
>
  <Download className="h-7 w-7 text-primary" />
  <span className="font-medium">Terms & Conditions</span>
</Button>

{/* Refund Policy */}
<Button
  variant="outline"
  className="h-auto py-5 flex flex-col items-center gap-2 rounded-xl border-2 hover:border-primary/40 hover:bg-primary/5 transition-colors"
  onClick={() => window.open("/pdfs/refund.pdf")}
>
  <Download className="h-7 w-7 text-primary" />
  <span className="font-medium">Refund Policy</span>
</Button>

{/* Privacy Policy */}
<Button
  variant="outline"
  className="h-auto py-5 flex flex-col items-center gap-2 rounded-xl border-2 hover:border-primary/40 hover:bg-primary/5 transition-colors"
  onClick={() => window.open("/pdfs/privacy.pdf")}
>
  <Download className="h-7 w-7 text-primary" />
  <span className="font-medium">Privacy Policy</span>
</Button>

</div>
          </div>
        </section>

        {/* ----- Footer ----- */}
        <footer className="border-t-2 border-border bg-gradient-to-b from-card to-muted/30 py-10 sm:py-14">
          <div className="container px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-10 sm:mb-12">
            <div>
  <p className="text-sm text-muted-foreground leading-relaxed">
    <span className="font-semibold text-foreground">Registered Name:</span><br />
    A S Upskill Academy
  </p>

  <p className="text-sm text-muted-foreground leading-relaxed mt-3">
    <span className="font-semibold text-foreground">GST:</span><br />
    27ACCFA9428L1Z1
  </p>
</div>
              <div>
                <p className="font-semibold text-foreground mb-4">Trust builders</p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2"><Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" /> {GOOGLE_REVIEW_STATS.rating} Google rating</li>
                  <li className="flex items-center gap-2"><Briefcase className="h-4 w-4 shrink-0 text-primary" /> {STATS[0].value} placement rate</li>
                  <li className="flex items-center gap-2"><Users className="h-4 w-4 shrink-0 text-primary" /> {STATS[1].value} students</li>
                  <li className="flex items-center gap-2"><Award className="h-4 w-4 shrink-0 text-primary" /> {INSTITUTE_STORY.yearsExperience}+ years</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground mb-3">Quick links</p>
                <ul className="text-sm space-y-2">
                  <li><button onClick={() => scrollTo("courses")} className="text-muted-foreground hover:text-foreground">Courses</button></li>
                  <li><button onClick={() => scrollTo("about")} className="text-muted-foreground hover:text-foreground">About</button></li>
                  <li><button onClick={() => scrollTo("placements")} className="text-muted-foreground hover:text-foreground">Placements</button></li>
                  <li><Link to="/login" className="text-muted-foreground hover:text-foreground">Login to LMS</Link></li>
                  <li><Link to="/register" className="text-muted-foreground hover:text-foreground">Apply now</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground mb-3">Contact</p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li><a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} className="hover:text-foreground">{CONTACT.phone}</a></li>
                  <li><a href={`mailto:${CONTACT.email}`} className="hover:text-foreground">{CONTACT.email}</a></li>
                  <li><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">WhatsApp</a></li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
              <span>© {new Date().getFullYear()} {INSTITUTE_NAME}. All rights reserved.</span>
              <div className="flex items-center gap-6">
                <Link to="/login" className="hover:text-foreground transition-colors">Login</Link>
                <Link to="/register" className="hover:text-foreground transition-colors">Register</Link>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* Sticky WhatsApp - single FAB, safe spacing above sticky bar on mobile */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="marketing-sticky-btn fixed bottom-6 right-4 sm:right-6 z-40 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg active:scale-95 transition-transform"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
      </a>

      {/* Sticky Call - hidden on mobile, shown on md+ to avoid overlap */}
      <a
        href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}
        className="marketing-sticky-btn fixed bottom-6 right-24 z-50 hidden md:flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg"
        aria-label="Call now"
      >
        <Phone className="h-6 w-6" />
      </a>
    </div>
  );
}
