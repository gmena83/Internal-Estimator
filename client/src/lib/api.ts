import { Project, Stage, ApiHealth, ProjectUsage } from '../types';

const API_BASE = '/api';

class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        throw new ApiError(response.status, `API Error: ${response.statusText}`);
    }

    return response.json();
}

export const api = {
    // Projects
    getProjects: async () => {
        // Map existing backend project structure to new UI types if needed
        const projects = await fetchJson<any[]>('/projects');
        return projects.map(p => ({
            id: p.id,
            name: p.title,
            client: p.clientName || 'Unknown',
            updatedAt: p.createdAt || new Date().toISOString(),
            status: p.status === 'complete' ? 'completed' : 'active',
            currentStage: p.currentStage
        })) as Project[];
    },
    getProject: async (id: string) => {
        const p = await fetchJson<any>(`/projects/${id}`);
        return {
            id: p.id,
            name: p.title,
            client: p.clientName || 'Unknown',
            updatedAt: p.createdAt || new Date().toISOString(),
            status: p.status === 'complete' ? 'completed' : 'active',
            currentStage: p.currentStage
        };
    },
    createProject: (data: Partial<Project>) => fetchJson<Project>('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    // Stages & Workflow
    getProjectStages: (id: string) => fetchJson<Stage[]>(`/projects/${id}/stages`),
    startStage: (id: string, stageId: string) => fetchJson<void>(`/projects/${id}/stages/${stageId}/start`, { method: 'POST' }),

    // ChatEndpoint for streaming
    chatEndpoint: (id: string) => `${API_BASE}/projects/${id}/chat`,

    // Metrics
    getHealth: () => fetchJson<ApiHealth[]>('/health'),
    getUsage: () => fetchJson<ProjectUsage>('/usage'),

    // Docs
    getDocuments: (id: string) => fetchJson<{ proposal: string; report: string; guide: string }>(`/projects/${id}/documents`),
};
