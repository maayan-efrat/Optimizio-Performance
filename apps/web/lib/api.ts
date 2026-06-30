const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  credits?: number;
}

export interface Project {
  id: string;
  name: string;
  domain: string;
  status: string;
  createdAt: string;
}

export interface RoadmapItem {
  rank: number;
  issue: string;
  impact: string;
  expectedImprovement: string;
  description: string;
  howToFix: string;
  codeExample?: string;
  resourceUrl?: string;
}

export interface AnalyzerIssue {
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  whyItMatters: string;
  recommendation: string;
  estimatedImpact?: string;
  resourceUrl?: string;
  details?: string;
  affectedUrls?: string[];
}

export interface AnalyzerResult {
  analyzer: string;
  score: number;
  issues: AnalyzerIssue[];
  metadata?: Record<string, unknown>;
}

export interface CompareResult {
  url: string;
  overall: number;
  scores: Record<string, number>;
}

export interface CWVData {
  lcp: number | null;
  cls: number | null;
  inp: number | null;
  ttfb: number | null;
  psiScore: number | null;
  lcpDisplay: string | null;
  clsDisplay: string | null;
  inpDisplay: string | null;
  ttfbDisplay: string | null;
}

export interface Scan {
  id: string;
  projectId: string;
  url: string;
  status: string;
  progressPercent: number;
  overallScore: number | null;
  performanceScore: number | null;
  seoScore: number | null;
  accessibilityScore: number | null;
  securityScore: number | null;
  mobileScore: number | null;
  privacyScore: number | null;
  schemaScore: number | null;
  jsCssScore: number | null;
  linksScore: number | null;
  aiSummary: string | null;
  priorityRoadmap: RoadmapItem[] | null;
  rawResults: AnalyzerResult[] | null;
  cwvLcp: number | null;
  cwvCls: number | null;
  cwvInp: number | null;
  cwvTtfb: number | null;
  cwvPsiScore: number | null;
  cwvData: CWVData | null;
  createdAt: string;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
      ...init,
    });
  } catch (err: any) {
    if (err?.message?.includes('Failed to fetch') || err?.name === 'TypeError') {
      throw new Error('SERVER_OFFLINE');
    }
    throw err;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error((error as { message?: string }).message || `HTTP_${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  health: () => request<{ status: string }>('/health'),
  auth: {
    login: (body: { email: string; password: string }) =>
      request<{ token: string; user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    register: (body: { email: string; password: string; name: string }) =>
      request<{ message: string; email: string; requiresVerification?: boolean; token?: string; user?: AuthUser }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    me: (explicitToken?: string) => {
      if (explicitToken) {
        return fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${explicitToken}` },
        }).then(r => r.json()) as Promise<{ user: AuthUser }>;
      }
      return request<{ user: AuthUser }>('/auth/me');
    },
    updateProfile: (body: { name: string }) =>
      request<{ user: AuthUser }>('/auth/me', { method: 'PATCH', body: JSON.stringify(body) }),
  },
  projects: {
    list: () => request<Project[]>('/projects'),
    create: (body: { name: string; domain: string }) =>
      request<Project>('/projects', { method: 'POST', body: JSON.stringify(body) }),
    delete: (id: string) =>
      request<{ deleted: boolean }>(`/projects/${id}`, { method: 'DELETE' }),
  },
  admin: {
    getStats: () =>
      request<{ totalUsers: number; totalScans: number; totalProjects: number; scansToday: number; paymentsEnabled: boolean }>('/admin/stats'),
    getUsers: () =>
      request<Array<{ id: string; email: string; name: string; role: string; credits: number; emailVerified: boolean; createdAt: string; _count: { projects: number } }>>('/admin/users'),
    updateCredits: (userId: string, credits: number) =>
      request<{ id: string; credits: number }>(`/admin/users/${userId}/credits`, { method: 'PATCH', body: JSON.stringify({ credits }) }),
    updateRole: (userId: string, role: 'user' | 'admin') =>
      request<{ id: string; role: string }>(`/admin/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  },
  payments: {
    createCheckout: (packageId: string) =>
      request<{ url: string }>('/payments/checkout', { method: 'POST', body: JSON.stringify({ packageId }) }),
    getCredits: () =>
      request<{ credits: number; paymentsEnabled: boolean }>('/payments/credits'),
    deductCredits: (amount: number) =>
      request<{ credits: number }>('/payments/deduct', { method: 'POST', body: JSON.stringify({ amount }) }),
  },
  scans: {
    create: (body: { projectId: string; url: string; locale?: string }) =>
      request<Scan>('/scans', { method: 'POST', body: JSON.stringify(body) }),
    getProgress: (id: string) =>
      request<{ id: string; status: string; progressPercent: number }>(`/scans/${id}/progress`),
    get: (id: string) => request<Scan>(`/scans/${id}`),
    getPublic: (id: string) =>
      fetch(`${API_BASE_URL}/scans/public/${id}`)
        .then(r => r.ok ? r.json() : Promise.reject(r)) as Promise<Scan>,
    listByProject: (projectId: string) => request<Scan[]>(`/scans/project/${projectId}`),
    compare: (urls: string[]) =>
      request<CompareResult[]>('/scans/compare', { method: 'POST', body: JSON.stringify({ urls }) }),
    saveExport: (scanId: string, userContext: string, lang: string) =>
      request<{ credits: number; exportId: string; exportCount: number }>(`/scans/${scanId}/export-prompt`, {
        method: 'POST', body: JSON.stringify({ userContext, lang }),
      }),
    getExportCount: (scanId: string) =>
      request<{ count: number }>(`/scans/${scanId}/export-count`),
    getExports: (scanId: string) =>
      request<Array<{ id: string; userContext: string; lang: string; createdAt: string }>>(`/scans/${scanId}/exports`),
  },
};
