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
  aiSummary: string | null;
  priorityRoadmap: RoadmapItem[] | null;
  rawResults: AnalyzerResult[] | null;
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
  },
  projects: {
    list: () => request<Project[]>('/projects'),
    create: (body: { name: string; domain: string }) =>
      request<Project>('/projects', { method: 'POST', body: JSON.stringify(body) }),
  },
  scans: {
    create: (body: { projectId: string; url: string; locale?: string }) =>
      request<Scan>('/scans', { method: 'POST', body: JSON.stringify(body) }),
    get: (id: string) => request<Scan>(`/scans/${id}`),
    listByProject: (projectId: string) => request<Scan[]>(`/scans/project/${projectId}`),
  },
};
