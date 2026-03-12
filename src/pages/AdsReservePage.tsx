import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ADS_LANDING } from "@/config/adsLanding";
import { Sparkles, ArrowRight } from "lucide-react";

const PAGE_SLUG = ADS_LANDING.pageSlug;

export default function AdsReservePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const search = new URLSearchParams(location.search);
    search.set("name", formData.name.trim());
    search.set("email", formData.email.trim());
    search.set("phone", formData.phone.trim());
    navigate(`/lp/${PAGE_SLUG}/checkout?${search.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white antialiased">
      <div className="max-w-md mx-auto px-4 py-8 sm:py-12">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            to={`/lp/${PAGE_SLUG}${location.search}`}
            className="text-sm text-slate-400 hover:text-violet-400 transition-colors"
          >
            ← Back to workshop page
          </Link>
          <span className="inline-flex items-center gap-2 text-xs sm:text-sm text-violet-300">
            <Sparkles className="h-4 w-4" />
            Step 1 · Enter your details
          </span>
        </div>

        <div className="rounded-2xl bg-white text-slate-900 p-5 sm:p-7 shadow-2xl shadow-black/30 border border-slate-200/60">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 mb-2">
            Step 1 · Reserve your seat
          </p>
          <h1 className="text-xl sm:text-2xl font-bold mb-1">Enter your details</h1>
          <p className="text-xs text-slate-500 mb-4">
            We&apos;ll send your workshop link, reminders and recording access to this email.
          </p>

          <form onSubmit={handleNext} className="space-y-4">
              <Input
                placeholder="Full name"
                value={formData.name}
                onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
                className="h-11 rounded-xl"
                required
              />
              <Input
                type="email"
                placeholder="Work / primary email"
                value={formData.email}
                onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))}
                className="h-11 rounded-xl"
                required
              />
              <Input
                type="tel"
                placeholder="WhatsApp number"
                value={formData.phone}
                onChange={(e) => setFormData((d) => ({ ...d, phone: e.target.value }))}
                className="h-11 rounded-xl"
                required
              />

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 text-white font-bold text-base flex items-center justify-center gap-2"
            >
              {submitting ? "Please wait…" : `Pay ${ADS_LANDING.offer.price} & Reserve Seat`}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </Button>

            <p className="text-[11px] text-slate-500 text-center">
              Next step will show your order summary and secure payment options.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

