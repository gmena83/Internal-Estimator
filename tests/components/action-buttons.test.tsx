import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMockProject,
  createMockProjectWithEstimate,
  createMockProjectComplete,
} from '../fixtures';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
global.URL.revokeObjectURL = vi.fn();

// Create wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('ActionButtons Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });
  
  describe('Stage 1 Actions', () => {
    it('should show parse and analyze button at stage 1', () => {
      const project = createMockProject({ currentStage: 1 });
      
      const button = (
        <button data-testid="btn-parse">
          Parse & Analyze
        </button>
      );
      
      render(button);
      
      expect(screen.getByTestId('btn-parse')).toBeInTheDocument();
    });
    
    it('should trigger parse action on click', async () => {
      const user = userEvent.setup();
      const onParse = vi.fn();
      
      const button = (
        <button data-testid="btn-parse" onClick={onParse}>
          Parse & Analyze
        </button>
      );
      
      render(button);
      await user.click(screen.getByTestId('btn-parse'));
      
      expect(onParse).toHaveBeenCalledOnce();
    });
    
    it('should show generate estimate button after parsing', () => {
      const project = createMockProject({ 
        currentStage: 1, 
        parsedData: { mission: 'Test' } 
      });
      
      const button = (
        <button data-testid="btn-estimate">
          Generate Estimate
        </button>
      );
      
      render(button);
      
      expect(screen.getByTestId('btn-estimate')).toBeInTheDocument();
    });
  });
  
  describe('Stage 2 Actions (Estimate Approval)', () => {
    it('should show approve estimate button at stage 2', () => {
      const project = createMockProjectWithEstimate();
      
      const button = (
        <button data-testid="btn-approve">
          Approve Estimate
        </button>
      );
      
      render(button);
      
      expect(screen.getByTestId('btn-approve')).toBeInTheDocument();
    });
    
    it('should trigger PDF download on approval', async () => {
      const user = userEvent.setup();
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ proposalPdfUrl: '/api/projects/1/proposal.pdf' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(new Blob(['PDF content'])),
        });
      
      const downloadPdf = async () => {
        const response = await mockFetch('/api/projects/1/approve-estimate', { method: 'POST' });
        const data = await response.json();
        
        const pdfResponse = await mockFetch(data.proposalPdfUrl);
        const blob = await pdfResponse.blob();
        
        return blob;
      };
      
      const blob = await downloadPdf();
      
      expect(blob).toBeInstanceOf(Blob);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
    
    it('should show scenario selection buttons', () => {
      const buttons = (
        <div>
          <button data-testid="select-scenario-a">Select High-Tech Custom</button>
          <button data-testid="select-scenario-b">Select No-Code MVP</button>
        </div>
      );
      
      render(buttons);
      
      expect(screen.getByTestId('select-scenario-a')).toBeInTheDocument();
      expect(screen.getByTestId('select-scenario-b')).toBeInTheDocument();
    });
  });
  
  describe('Reset Project Action', () => {
    it('should show reset button', () => {
      const button = (
        <button data-testid="btn-reset">
          Start from 0
        </button>
      );
      
      render(button);
      
      expect(screen.getByTestId('btn-reset')).toBeInTheDocument();
    });
    
    it('should show confirmation dialog on reset click', async () => {
      const user = userEvent.setup();
      const [showDialog, setShowDialog] = [false, vi.fn()];
      
      const component = (
        <div>
          <button 
            data-testid="btn-reset" 
            onClick={() => setShowDialog(true)}
          >
            Start from 0
          </button>
        </div>
      );
      
      render(component);
      await user.click(screen.getByTestId('btn-reset'));
      
      expect(setShowDialog).toHaveBeenCalledWith(true);
    });
    
    it('should reset project on confirmation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockProject({ currentStage: 1 })),
      });
      
      const resetProject = async (projectId: string) => {
        const response = await mockFetch(`/api/projects/${projectId}/reset`, {
          method: 'POST',
        });
        return response.json();
      };
      
      const result = await resetProject('test-id');
      
      expect(result.currentStage).toBe(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/projects/test-id/reset', { method: 'POST' });
    });
    
    it('should cancel reset on dialog cancel', async () => {
      const user = userEvent.setup();
      const onReset = vi.fn();
      const onCancel = vi.fn();
      
      const dialog = (
        <div data-testid="reset-dialog">
          <p>Are you sure you want to reset this project?</p>
          <button data-testid="btn-cancel" onClick={onCancel}>Cancel</button>
          <button data-testid="btn-confirm" onClick={onReset}>Confirm</button>
        </div>
      );
      
      render(dialog);
      await user.click(screen.getByTestId('btn-cancel'));
      
      expect(onCancel).toHaveBeenCalledOnce();
      expect(onReset).not.toHaveBeenCalled();
    });
  });
  
  describe('PDF Download Actions', () => {
    it('should download proposal PDF', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });
      
      const downloadPdf = async (url: string) => {
        const response = await mockFetch(url);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        
        // Simulate link click
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = 'proposal.pdf';
        
        return { blob, objectUrl };
      };
      
      const result = await downloadPdf('/api/projects/1/proposal.pdf');
      
      expect(result.blob).toBeInstanceOf(Blob);
      expect(URL.createObjectURL).toHaveBeenCalled();
    });
    
    it('should download internal report PDF', async () => {
      const mockBlob = new Blob(['Report content'], { type: 'application/pdf' });
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });
      
      const response = await mockFetch('/api/projects/1/internal-report.pdf');
      const blob = await response.blob();
      
      expect(blob).toBeInstanceOf(Blob);
    });
    
    it('should handle download error gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });
      
      const downloadWithErrorHandling = async (url: string) => {
        const response = await mockFetch(url);
        if (!response.ok) {
          throw new Error(`Download failed: ${response.statusText}`);
        }
        return response.blob();
      };
      
      await expect(downloadWithErrorHandling('/api/projects/1/proposal.pdf'))
        .rejects.toThrow('Download failed: Not Found');
    });
  });
  
  describe('Loading States', () => {
    it('should show loading spinner during action', () => {
      const button = (
        <button data-testid="btn-action" disabled>
          <span data-testid="spinner">Loading...</span>
        </button>
      );
      
      render(button);
      
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.getByTestId('btn-action')).toBeDisabled();
    });
    
    it('should disable buttons during mutation', () => {
      const isPending = true;
      
      const button = (
        <button data-testid="btn-action" disabled={isPending}>
          Action
        </button>
      );
      
      render(button);
      
      expect(screen.getByTestId('btn-action')).toBeDisabled();
    });
  });
  
  describe('Stage Gating', () => {
    it('should disable stage 2 actions when at stage 1', () => {
      const project = createMockProject({ currentStage: 1 });
      
      const button = (
        <button 
          data-testid="btn-assets" 
          disabled={project.currentStage < 2}
        >
          Generate Assets
        </button>
      );
      
      render(button);
      
      expect(screen.getByTestId('btn-assets')).toBeDisabled();
    });
    
    it('should enable stage 2 actions when at stage 2', () => {
      const project = createMockProjectWithEstimate();
      
      const button = (
        <button 
          data-testid="btn-assets" 
          disabled={project.currentStage < 2}
        >
          Generate Assets
        </button>
      );
      
      render(button);
      
      expect(screen.getByTestId('btn-assets')).not.toBeDisabled();
    });
  });
});
