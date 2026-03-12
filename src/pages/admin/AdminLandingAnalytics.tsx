import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { BarChart3, Users, ExternalLink, RefreshCw } from "lucide-react";

type LandingPageSummary = {
  pageSlug: string;
  totalVisits: number;
};

type LandingAnalytics = {
  pageSlug: string;
  totalVisits: number;
  uniqueVisitorsByIp: number;
  bySource: Record<string, number>;
  byCampaign: Record<string, number>;
  byMedium: Record<string, number>;
  byDate: Record<string, number>;
  recentVisits: Array<{
    visitedAt: string;
    utmSource?: string | null;
    utmCampaign?: string | null;
    referrer?: string | null;
  }>;
};

type LandingLead = {
  id: string;
  pageSlug: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  amountInr: number;
  currency: string;
  stripeSessionId?: string | null;
  stripePaymentId?: string | null;
  utmSource?: string | null;
  utmCampaign?: string | null;
  utmMedium?: string | null;
};

type LandingConfig = {
  dateLabel?: string | null;
  timeLabel?: string | null;
  modeLabel?: string | null;
};

const AdminLandingAnalytics: React.FC = () => {
  const [pages, setPages] = useState<LandingPageSummary[]>([]);
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<LandingAnalytics | null>(null);
  const [leads, setLeads] = useState<LandingLead[]>([]);
  const [config, setConfig] = useState<LandingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await api.get("/landing-analytics");
      if (res.ok) {
        const data = await res.json();
        setPages(data);
        if (data.length > 0 && !selectedPage) {
          setSelectedPage(data[0].pageSlug);
        }
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to load landing pages", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!selectedPage) return;
    try {
      setLoadingAnalytics(true);
      const res = await api.get(`/landing-analytics/${encodeURIComponent(selectedPage)}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to load analytics", variant: "destructive" });
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchLeads = async () => {
    if (!selectedPage) return;
    try {
      setLoadingLeads(true);
      const res = await api.get(`/landing-analytics/${encodeURIComponent(selectedPage)}/leads`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to load leads", variant: "destructive" });
    } finally {
      setLoadingLeads(false);
    }
  };

  const fetchConfig = async () => {
    if (!selectedPage) return;
    try {
      const res = await api.get(`/landing-analytics/${encodeURIComponent(selectedPage)}/config`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveConfig = async () => {
    if (!selectedPage || !config) return;
    try {
      setSavingConfig(true);
      const res = await api.put(`/landing-analytics/${encodeURIComponent(selectedPage)}/config`, config);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save config");
      }
      toast({ title: "Saved", description: "Workshop details updated." });
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to save workshop details",
        variant: "destructive",
      });
    } finally {
      setSavingConfig(false);
    }
  };

  useEffect(() => {
    fetchPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedPage) {
      fetchAnalytics();
      fetchLeads();
      fetchConfig();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPage]);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const landingUrl = selectedPage ? `${baseUrl}/lp/${selectedPage}` : "";

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-12 text-muted-foreground">Loading landing pages...</div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card>
          <CardHeader>
            <CardTitle>Landing Page Analytics</CardTitle>
            <CardDescription>Visitor tracking for ads campaign landing pages</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No landing page visits yet. When visitors access{" "}
              <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                {baseUrl}/lp/working-professionals
              </code>
              , visits will be tracked here.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This page is only reachable by direct URL (no links in the app). Use it in Meta/Google ads.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Landing Page Analytics</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Visitor tracking for ads campaign pages (e.g. /lp/working-professionals)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={selectedPage ?? ""}
            onChange={(e) => setSelectedPage(e.target.value || null)}
          >
            {pages.map((p) => (
              <option key={p.pageSlug} value={p.pageSlug}>
                /lp/{p.pageSlug} ({p.totalVisits} visits)
              </option>
            ))}
          </select>
          <Button variant="outline" size="icon" onClick={() => fetchAnalytics()} disabled={loadingAnalytics}>
            <RefreshCw className={`h-4 w-4 ${loadingAnalytics ? "animate-spin" : ""}`} />
          </Button>
          {landingUrl && (
            <a href={landingUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Open page
              </Button>
            </a>
          )}
        </div>
      </div>

      {loadingAnalytics && !analytics ? (
        <div className="text-center py-12 text-muted-foreground">Loading analytics...</div>
      ) : analytics ? (
        <div className="grid gap-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Visits
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalVisits}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Unique (by IP)
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.uniqueVisitorsByIp}</div>
              </CardContent>
            </Card>
          </div>

          {/* Workshop details config */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workshop details (hero chips)</CardTitle>
              <CardDescription>Shown under the hero image on /lp/{selectedPage}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Date label</label>
                  <input
                    className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm"
                    placeholder="14th March Saturday"
                    value={config?.dateLabel ?? ""}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...(prev ?? {}), dateLabel: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Time label</label>
                  <input
                    className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm"
                    placeholder="10 AM to 7 PM IST"
                    value={config?.timeLabel ?? ""}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...(prev ?? {}), timeLabel: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Mode</label>
                  <input
                    className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm"
                    placeholder="Online"
                    value={config?.modeLabel ?? ""}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...(prev ?? {}), modeLabel: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={saveConfig} disabled={savingConfig}>
                  {savingConfig ? "Saving..." : "Save details"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {(Object.keys(analytics.bySource).length > 0 ||
            Object.keys(analytics.byCampaign).length > 0 ||
            Object.keys(analytics.byMedium).length > 0) && (
            <div className="grid md:grid-cols-3 gap-6">
              {Object.keys(analytics.bySource).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">By UTM Source</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {Object.entries(analytics.bySource)
                        .sort(([, a], [, b]) => b - a)
                        .map(([k, v]) => (
                          <li key={k} className="flex justify-between">
                            <span className="text-muted-foreground">{k || "(direct)"}</span>
                            <span className="font-medium">{v}</span>
                          </li>
                        ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              {Object.keys(analytics.byCampaign).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">By UTM Campaign</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {Object.entries(analytics.byCampaign)
                        .sort(([, a], [, b]) => b - a)
                        .map(([k, v]) => (
                          <li key={k} className="flex justify-between">
                            <span className="text-muted-foreground truncate max-w-[180px]">{k}</span>
                            <span className="font-medium shrink-0">{v}</span>
                          </li>
                        ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              {Object.keys(analytics.byMedium).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">By UTM Medium</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {Object.entries(analytics.byMedium)
                        .sort(([, a], [, b]) => b - a)
                        .map(([k, v]) => (
                          <li key={k} className="flex justify-between">
                            <span className="text-muted-foreground">{k}</span>
                            <span className="font-medium">{v}</span>
                          </li>
                        ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {Object.keys(analytics.byDate).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Visits by Date</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Date</th>
                        <th className="text-right py-2 font-medium">Visits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(analytics.byDate)
                        .sort(([a], [b]) => b.localeCompare(a))
                        .map(([date, count]) => (
                          <tr key={date} className="border-b last:border-0">
                            <td className="py-2 text-muted-foreground">{date}</td>
                            <td className="py-2 text-right font-medium">{count}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {analytics.recentVisits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Visits</CardTitle>
                <CardDescription>Last 50 visits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Time</th>
                        <th className="text-left py-2 font-medium">Source</th>
                        <th className="text-left py-2 font-medium">Campaign</th>
                        <th className="text-left py-2 font-medium">Referrer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.recentVisits.map((v, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 text-muted-foreground whitespace-nowrap">
                            {new Date(v.visitedAt).toLocaleString()}
                          </td>
                          <td className="py-2">{v.utmSource || "—"}</td>
                          <td className="py-2 truncate max-w-[150px]">{v.utmCampaign || "—"}</td>
                          <td className="py-2 truncate max-w-[200px] text-muted-foreground">
                            {v.referrer || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leads</CardTitle>
              <CardDescription>Captured details + payment status (Stripe)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-sm text-muted-foreground">
                  Total: <span className="font-medium text-foreground">{leads.length}</span>
                </p>
                <Button variant="outline" size="sm" onClick={() => fetchLeads()} disabled={loadingLeads}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingLeads ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
              {leads.length === 0 ? (
                <div className="text-sm text-muted-foreground">No leads yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Time</th>
                        <th className="text-left py-2 font-medium">Name</th>
                        <th className="text-left py-2 font-medium">Email</th>
                        <th className="text-left py-2 font-medium">Phone</th>
                        <th className="text-left py-2 font-medium">Status</th>
                        <th className="text-left py-2 font-medium">UTM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.slice(0, 200).map((l) => (
                        <tr key={l.id} className="border-b last:border-0">
                          <td className="py-2 text-muted-foreground whitespace-nowrap">
                            {new Date(l.createdAt).toLocaleString()}
                          </td>
                          <td className="py-2 font-medium">{l.name}</td>
                          <td className="py-2">{l.email}</td>
                          <td className="py-2 whitespace-nowrap">{l.phone}</td>
                          <td className="py-2">
                            <Badge
                              className={
                                l.paymentStatus === "PAID"
                                  ? "bg-green-600/10 text-green-700 border border-green-600/20"
                                  : l.paymentStatus === "FAILED"
                                    ? "bg-red-600/10 text-red-700 border border-red-600/20"
                                    : "bg-amber-600/10 text-amber-700 border border-amber-600/20"
                              }
                            >
                              {l.paymentStatus}
                            </Badge>
                          </td>
                          <td className="py-2 text-muted-foreground">
                            {(l.utmSource || l.utmMedium || l.utmCampaign) ? (
                              <span className="truncate inline-block max-w-[260px]">
                                {l.utmSource || "—"} / {l.utmMedium || "—"} / {l.utmCampaign || "—"}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {leads.length > 200 && (
                <p className="text-xs text-muted-foreground mt-2">Showing latest 200 leads.</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
};

export default AdminLandingAnalytics;
