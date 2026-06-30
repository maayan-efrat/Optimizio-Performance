import { AnalyzerResult } from '../analyzers/base.analyzer';

export interface RoadmapItem {
  rank: number;
  issue: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  expectedImprovement: string;
  description: string;
  howToFix: string;
  codeExample?: string;
  resourceUrl?: string;
}

export interface AIResponse {
  summary: string;
  recommendations: string[];
  priorityRoadmap?: RoadmapItem[];
}

export class AIService {
  async analyze(
    results: AnalyzerResult[],
    url: string,
    html: string,
    locale: 'he' | 'en' = 'en',
  ): Promise<AIResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('[AI] No OPENAI_API_KEY — using mock response');
      return this.mockResponse(locale);
    }
    try {
      return await this.callOpenAI(results, url, html, locale, apiKey);
    } catch (err) {
      console.error('[AI] OpenAI call failed:', err);
      return this.mockResponse(locale);
    }
  }

  private async callOpenAI(
    results: AnalyzerResult[],
    url: string,
    html: string,
    locale: 'he' | 'en',
    apiKey: string,
  ): Promise<AIResponse> {
    const isHebrew = locale === 'he';
    const langNote = isHebrew
      ? 'חובה להשיב אך ורק בעברית. כל מילה חייבת להיות בעברית — issue, description, howToFix, codeExample (שמות הפרמטרים JSON נשארים באנגלית).'
      : 'Respond in English.';

    const systemPrompt = `You are an expert website performance analyst. ${langNote}

Return a JSON object with this EXACT structure (no markdown, pure JSON):
{
  "summary": "2-3 sentence executive summary of the site's performance",
  "priorityRoadmap": [
    {
      "rank": 1,
      "issue": "Short issue title",
      "impact": "HIGH",
      "expectedImprovement": "+12 points",
      "description": "Detailed explanation of the problem and why it matters for performance/SEO/accessibility",
      "howToFix": "Clear step-by-step instructions to fix this issue",
      "codeExample": "Concrete HTML/CSS/JS code snippet demonstrating the fix",
      "resourceUrl": "URL of the specific resource causing the issue (if identifiable from the HTML)"
    }
  ]
}

Rules:
- Provide exactly 3-5 roadmap items ordered by impact (HIGH first)
- impact must be exactly "HIGH", "MEDIUM", or "LOW"
- codeExample should be a real, applicable snippet — not pseudo-code
- resourceUrl should be a real URL extracted from the HTML if possible, otherwise omit it
- Be specific to the actual website: ${url}`;

    const scores = results
      .map((r) => `${r.analyzer}: ${r.score}/100 (${r.issues.length} issues)`)
      .join(', ');
    const issuesList = results
      .flatMap((r) => r.issues)
      .map((i) => `[${i.severity.toUpperCase()}] ${i.title}: ${i.description}`)
      .join('\n');

    const imgCount = (html.match(/<img/gi) || []).length;
    const imgWithAlt = (html.match(/alt="[^"]+"/gi) || []).length;
    const scriptCount = (html.match(/<script/gi) || []).length;
    const deferCount = (html.match(/defer/gi) || []).length;
    const hasMeta = html.includes('name="description"');
    const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1] || 'unknown';
    const imgSrcs = [...html.matchAll(/src="([^"]+\.(jpg|jpeg|png|gif|bmp|svg)[^"]*)"/gi)]
      .slice(0, 5)
      .map((m) => m[1]);

    const userMessage = `Website URL: ${url}
Page title: ${title}
Scores: ${scores}

Issues detected:
${issuesList || 'No specific issues flagged'}

HTML statistics:
- Images: ${imgCount} total, ${imgWithAlt} have alt text, ${imgCount - imgWithAlt} missing alt
- Scripts: ${scriptCount} total, ${deferCount} deferred
- Meta description: ${hasMeta ? 'present' : 'MISSING'}
- Sample image URLs found: ${imgSrcs.join(', ') || 'none'}

HTML excerpt (first 2000 chars):
${html.slice(0, 2000)}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI ${response.status}: ${errText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const parsed = JSON.parse(data.choices[0].message.content) as {
      summary: string;
      priorityRoadmap: RoadmapItem[];
    };

    return {
      summary: parsed.summary || '',
      recommendations: [],
      priorityRoadmap: (parsed.priorityRoadmap || []).map((item) => ({
        rank: item.rank,
        issue: item.issue,
        impact: item.impact,
        expectedImprovement: item.expectedImprovement,
        description: item.description,
        howToFix: item.howToFix,
        codeExample: item.codeExample,
        resourceUrl: item.resourceUrl,
      })),
    };
  }

  private mockResponse(locale: 'he' | 'en'): AIResponse {
    const he = locale === 'he';
    return {
      summary: he
        ? 'האתר מציג ביצועים סבירים עם מספר הזדמנויות שיפור. אופטימיזציה של תמונות והסרת קוד חוסם רינדור יביאו את ההשפעה הגדולה ביותר.'
        : 'The site shows decent performance with several improvement opportunities. Image optimization and removing render-blocking code will have the biggest impact.',
      recommendations: [],
      priorityRoadmap: [
        {
          rank: 1,
          issue: he ? 'תמונות לא מאופטמות' : 'Unoptimized images',
          impact: 'HIGH',
          expectedImprovement: '+12 points',
          description: he
            ? 'תמונות כבדות הן אחד הגורמים העיקריים לטעינה איטית. פורמט WebP חוסך עד 40% ממשקל התמונה לעומת JPEG/PNG.'
            : 'Heavy images are one of the main causes of slow loading. WebP format saves up to 40% file size vs JPEG/PNG.',
          howToFix: he
            ? '1. המירי תמונות לפורמט WebP\n2. הוסיפי loading="lazy" לתמונות מתחת לקו הגלילה\n3. הגדירי width ו-height לכל תמונה כדי למנוע CLS'
            : '1. Convert images to WebP format\n2. Add loading="lazy" to below-fold images\n3. Set explicit width and height to prevent CLS',
          codeExample: '<img src="hero.webp" alt="תיאור התמונה" loading="lazy" width="1200" height="630">',
        },
        {
          rank: 2,
          issue: he ? 'JavaScript חוסם רינדור' : 'Render-blocking JavaScript',
          impact: 'MEDIUM',
          expectedImprovement: '+8 points',
          description: he
            ? 'סקריפטים ללא defer או async נטענים בסנכרון ועוצרים את בניית ה-DOM, מה שמאריך את זמן הטעינה הנראה למשתמש.'
            : 'Scripts without defer or async load synchronously, blocking DOM construction and increasing perceived load time.',
          howToFix: he
            ? '1. הוסיפי defer לכל <script> שאינו קריטי\n2. העבירי תגיות script לסוף ה-body\n3. השתמשי ב-async לסקריפטים צד-שלישי כמו analytics'
            : '1. Add defer to all non-critical <script> tags\n2. Move script tags to the end of body\n3. Use async for third-party scripts like analytics',
          codeExample: '<!-- לפני -->\n<script src="app.js"></script>\n\n<!-- אחרי -->\n<script src="app.js" defer></script>',
        },
        {
          rank: 3,
          issue: he ? 'תיאור מטא חסר' : 'Missing meta description',
          impact: 'LOW',
          expectedImprovement: '+3 points',
          description: he
            ? 'תיאור מטא חסר גורם למנועי חיפוש לבחור טקסט אקראי מהדף כתיאור, מה שמפחית שיעורי קליק (CTR).'
            : 'A missing meta description causes search engines to pick random text as the description, reducing click-through rates.',
          howToFix: he
            ? 'הוסיפי תג <meta name="description"> לראש כל דף עם תיאור בין 120-160 תווים המסביר את תוכן הדף.'
            : 'Add a <meta name="description"> tag to the head of every page with a 120-160 character description.',
          codeExample: '<meta name="description" content="תיאור קצר וממוקד של תוכן הדף — בין 120 ל-160 תווים.">',
        },
      ],
    };
  }
}
