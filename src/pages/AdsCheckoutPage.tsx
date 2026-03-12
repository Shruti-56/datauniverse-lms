import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ADS_LANDING, CONTACT } from "@/config/adsLanding";
import { toast } from "@/hooks/use-toast";
import { Sparkles, Check, Gift, Shield, ArrowRight } from "lucide-react";

const PAGE_SLUG = ADS_LANDING.pageSlug;

export default function AdsCheckoutPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const name = params.get("name") || "";
  const email = params.get("email") || "";
  const phone = params.get("phone") || "";
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const leadId = params.get("lead_id");
    const stripeSessionId = params.get("stripe_session_id");
    const payment = params.get("payment");
    if (payment === "success" && leadId && stripeSessionId) {
      const apiBase = `${window.location.origin}/api`;
      fetch(
        `${apiBase}/landing-analytics/lead/verify?leadId=${encodeURIComponent(
          leadId
        )}&sessionId=${encodeURIComponent(stripeSessionId)}`
      )
        .then(async (r) => {
          const data = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(data.error || "Payment verification failed");
          if (data.paid) {
            toast({
              title: "Payment successful",
              description: "Your seat is confirmed. Please check your email for details.",
            });
          } else {
            toast({
              title: "Payment pending",
              description: "If you were charged but see pending, contact support.",
            });
          }
        })
        .catch((e: unknown) => {
          toast({
            title: "Payment verification failed",
            description:
              e instanceof Error ? e.message : "Please contact support if the amount was deducted.",
            variant: "destructive",
          });
        })
        .finally(() => {
          window.history.replaceState({}, "", window.location.pathname + location.search.split("&payment=")[0]);
        });
    } else if (payment === "cancel" && leadId) {
      toast({
        title: "Payment not completed",
        description: "Your details were saved. You can complete payment anytime.",
      });
      window.history.replaceState({}, "", window.location.pathname + location.search.split("&payment=")[0]);
    }
  }, [location.pathname, location.search, params]);

  const handlePay = async () => {
    if (!name || !email || !phone) {
      toast({
        title: "Missing details",
        description: "Please go back and fill your details first.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const baseParams = new URLSearchParams(location.search);
      baseParams.delete("lead_id");
      baseParams.delete("stripe_session_id");
      baseParams.delete("payment");
      const apiBase = `${window.location.origin}/api`;
      const returnBaseUrl = `${window.location.origin}${location.pathname}?${baseParams.toString()}`;
      const res = await fetch(`${apiBase}/landing-analytics/lead/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageSlug: PAGE_SLUG,
          name,
          email,
          phone,
          returnBaseUrl,
          referrer: document.referrer || undefined,
          utm_source: baseParams.get("utm_source") || undefined,
          utm_medium: baseParams.get("utm_medium") || undefined,
          utm_campaign: baseParams.get("utm_campaign") || undefined,
          utm_content: baseParams.get("utm_content") || undefined,
          utm_term: baseParams.get("utm_term") || undefined,
        }),
        credentials: "omit",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl as string;
        return;
      }
      throw new Error(data.error || "Could not start payment. Please try again.");
    } catch (err: unknown) {
      toast({
        title: "Could not start payment",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white antialiased">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            to={`/lp/${PAGE_SLUG}/reserve${location.search}`}
            className="text-sm text-slate-400 hover:text-violet-400 transition-colors"
          >
            ← Back to details
          </Link>
          <span className="inline-flex items-center gap-2 text-xs sm:text-sm text-violet-300">
            <Sparkles className="h-4 w-4" />
            Step 2 · Review & pay
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr] items-start">
          {/* Left: Order summary + bonuses */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-violet-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl shadow-violet-900/40">
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-300 mb-2">
                One decision that compounds for years
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-3">
                {ADS_LANDING.headline.split("—")[0]?.trim() || "AI Workshop Seat"}
              </h1>
              {/* Order summary */}
              <div className="mt-4 rounded-2xl bg-black/40 border border-white/10 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Subtotal</span>
                  <span className="text-slate-300 line-through">₹1,999</span>
                </div>
                <div className="flex items-center justify-between text-sm text-emerald-400">
                  <span>Limited-time discount</span>
                  <span>-₹1,900</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Total before taxes</span>
                  <span className="text-slate-100">₹99</span>
                </div>
                <div className="border-t border-white/10 pt-3 mt-1 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wider text-slate-400">Total payable</p>
                    <p className="text-3xl font-bold text-emerald-400">₹99</p>
                  </div>
                  <div className="text-right text-xs text-slate-400 max-w-[180px]">
                    Less than a coffee for a skill that can pay you for years.
                  </div>
                </div>
              </div>

              {/* Why this is underpriced */}
              <div className="mt-5 grid sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-7 w-7 rounded-full bg-violet-500/20 flex items-center justify-center">
                    <Gift className="h-4 w-4 text-violet-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Lifetime recording access</p>
                    <p className="text-xs text-slate-400">
                      Rewatch the entire session anytime so you never miss an insight or shortcut.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-7 w-7 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <Check className="h-4 w-4 text-emerald-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Plug-and-play AI templates</p>
                    <p className="text-xs text-slate-400">
                      Prompts, frameworks and checklists you can copy-paste into your real work the next morning.
                    </p>
                  </div>
                </div>
              </div>

       
            </div>

            {/* Gentle but strong push */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 sm:p-5 space-y-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">
                If you skip this today…
              </p>
              <ul className="space-y-2 text-slate-300">
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-400" />
                  <span>
                    You&apos;ll still have the same questions about how to actually use AI at work – while others start
                    shipping faster and looking &quot;10x&quot; to their managers.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-400" />
                  <span>
                    You&apos;ll keep scrolling &quot;AI hacks&quot; on social media instead of having a real, guided system you
                    can implement in one evening.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-400" />
                  <span>
                    This exact offer may not be available again at ₹99. The safest time to say yes is when the price
                    is this low and the upside is this high.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right: Recap of details + pay button */}
          <div className="rounded-2xl bg-white text-slate-900 p-5 sm:p-7 shadow-2xl shadow-black/30 border border-slate-200/60 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 mb-1">
              Your details
            </p>
            <div className="text-sm space-y-1 border border-slate-200 rounded-xl p-4 bg-slate-50">
              <div>
                <span className="text-slate-500">Name:</span>{" "}
                <span className="font-medium text-slate-900">{name || "Not provided"}</span>
              </div>
              <div>
                <span className="text-slate-500">Email:</span>{" "}
                <span className="font-medium text-slate-900 break-all">{email || "Not provided"}</span>
              </div>
              <div>
                <span className="text-slate-500">WhatsApp:</span>{" "}
                <span className="font-medium text-slate-900">{phone || "Not provided"}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 space-y-2">
              <p className="font-semibold text-slate-800">What people say after similar sessions</p>
              <p>
                “I finally understood how to plug AI into my daily work. The 3 hours I spent here save me 3–4 hours
                every single week now.”
              </p>
              <p className="text-[11px] text-slate-500">— Working professional, switched to an AI-heavy role</p>
            </div>

            <Button
              type="button"
              disabled={submitting}
              onClick={handlePay}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 text-white font-bold text-base flex items-center justify-center gap-2"
            >
              {submitting ? "Redirecting to payment…" : "Pay ₹99.00"}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </Button>

            <p className="text-[11px] text-slate-500 text-center">
              By proceeding, you agree to our{" "}
              <span className="underline decoration-dotted">Terms</span> and{" "}
              <span className="underline decoration-dotted">Refund Policy</span>.
            </p>
            <p className="text-[11px] text-slate-400 text-center">
              Need help?{" "}
              <a
                href={`https://wa.me/${CONTACT.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-dotted"
              >
                Chat with us on WhatsApp
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

