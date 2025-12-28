import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { Project, Stage } from '../types';

// Projects
export const useProjects = () => {
    return useQuery({
        queryKey: ['projects'],
        queryFn: api.getProjects,
        refetchInterval: 10000,
    });
};

export const useProject = (id?: string) => {
    return useQuery({
        queryKey: ['project', id],
        queryFn: () => api.getProject(id!),
        enabled: !!id,
    });
};

export const useCreateProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.createProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });
};

// Stages
export const useProjectStages = (projectId?: string) => {
    return useQuery({
        queryKey: ['stages', projectId],
        queryFn: () => api.getProjectStages(projectId!),
        enabled: !!projectId,
        refetchInterval: (query) => {
            const data = query.state.data as Stage[] | undefined;
            const isRunning = data?.some(s => s.status === 'running');
            return isRunning ? 2000 : false;
        }
    });
};

// System Health
export const useSystemHealth = () => {
    return useQuery({
        queryKey: ['health'],
        queryFn: api.getHealth,
        refetchInterval: 5000,
    });
};

// Usage
export const useProjectUsage = () => {
    return useQuery({
        queryKey: ['usage'],
        queryFn: api.getUsage,
        refetchInterval: 10000,
    });
};

// Documents
export const useProjectDocuments = (projectId?: string) => {
    return useQuery({
        queryKey: ['documents', projectId],
        queryFn: () => api.getDocuments(projectId!),
        enabled: !!projectId,
    });
};

export const useStartStage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, stageId }: { projectId: string, stageId: string }) =>
            api.startStage(projectId, stageId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['stages', variables.projectId] });
        },
    });
};
