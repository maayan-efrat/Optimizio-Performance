const UA = 'Mozilla/5.0 (compatible; Optimizio-Scanner/2.0; +https://optimizio.app)';

export interface CWVData {
  lcp: number | null;       // ms
  cls: number | null;       // unitless
  inp: number | null;       // ms
  ttfb: number | null;      // ms
  psiScore: number | null;  // 0-100
  lcpDisplay: string | null;
  clsDisplay: string | null;
  inpDisplay: string | null;
  ttfbDisplay: string | null;
}

export class PSIService {
  async fetch(url: string): Promise<CWVData> {
    const apiKey = process.env.GOOGLE_API_KEY;
    const endpoint =
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed` +
      `?url=${encodeURIComponent(url)}&strategy=mobile&category=performance` +
      (apiKey ? `&key=${apiKey}` : '');

    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 30_000);
      const res = await fetch(endpoint, {
        headers: { 'User-Agent': UA },
        signal: ctrl.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        console.warn(`[PSI] API returned ${res.status} for ${url}`);
        return this.empty();
      }

      const data = await res.json() as Record<string, any>;
      const audits = data.lighthouseResult?.audits ?? {};
      const score: number | null = data.lighthouseResult?.categories?.performance?.score ?? null;

      return {
        lcp:        audits['largest-contentful-paint']?.numericValue  ?? null,
        cls:        audits['cumulative-layout-shift']?.numericValue   ?? null,
        inp:        audits['interaction-to-next-paint']?.numericValue ?? null,
        ttfb:       audits['server-response-time']?.numericValue      ?? null,
        psiScore:   score !== null ? Math.round(score * 100) : null,
        lcpDisplay: audits['largest-contentful-paint']?.displayValue  ?? null,
        clsDisplay: audits['cumulative-layout-shift']?.displayValue   ?? null,
        inpDisplay: audits['interaction-to-next-paint']?.displayValue ?? null,
        ttfbDisplay:audits['server-response-time']?.displayValue      ?? null,
      };
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn('[PSI] Failed:', err?.message ?? err);
      }
      return this.empty();
    }
  }

  private empty(): CWVData {
    return {
      lcp: null, cls: null, inp: null, ttfb: null, psiScore: null,
      lcpDisplay: null, clsDisplay: null, inpDisplay: null, ttfbDisplay: null,
    };
  }
}
