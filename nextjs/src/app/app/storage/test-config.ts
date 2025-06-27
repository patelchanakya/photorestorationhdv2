/**
 * Test Configuration for Smart Polling System
 * 
 * This file provides easy-to-use test scenarios and configurations
 * for testing the polling system under different conditions.
 */

import { ProcessingJob } from '@/app/actions/jobs';

// Polling interval presets for different testing scenarios
export const POLLING_PRESETS = {
  // Development testing - very fast for quick feedback
  RAPID: 500,
  
  // Normal development - good balance
  FAST: 1000,
  
  // Production default - efficient for real use
  NORMAL: 3000,
  
  // Slow updates - for background monitoring
  SLOW: 10000,
  
  // Very slow - for testing timeout scenarios
  VERY_SLOW: 30000,
} as const;

// Test job scenarios
export const TEST_SCENARIOS = {
  NO_JOBS: {
    name: 'No Jobs',
    description: 'No processing jobs exist',
    jobs: [],
    expectedPolling: false,
  },
  
  ALL_COMPLETED: {
    name: 'All Completed',
    description: 'All jobs are finished (completed/failed/cancelled)',
    jobs: [
      createTestJob('job-1', 'completed'),
      createTestJob('job-2', 'failed'),
      createTestJob('job-3', 'cancelled'),
    ],
    expectedPolling: false,
  },
  
  SINGLE_ACTIVE: {
    name: 'Single Active Job',
    description: 'One job is processing',
    jobs: [
      createTestJob('job-1', 'processing'),
      createTestJob('job-2', 'completed'),
    ],
    expectedPolling: true,
  },
  
  MULTIPLE_ACTIVE: {
    name: 'Multiple Active Jobs',
    description: 'Several jobs are pending/processing',
    jobs: [
      createTestJob('job-1', 'pending'),
      createTestJob('job-2', 'processing'),
      createTestJob('job-3', 'completed'),
      createTestJob('job-4', 'processing'),
    ],
    expectedPolling: true,
  },
  
  MIXED_STATES: {
    name: 'Mixed Job States',
    description: 'Jobs in various states',
    jobs: [
      createTestJob('job-1', 'pending'),
      createTestJob('job-2', 'processing'),
      createTestJob('job-3', 'completed'),
      createTestJob('job-4', 'failed'),
      createTestJob('job-5', 'cancelled'),
    ],
    expectedPolling: true,
  },
  
  STATUS_TRANSITIONS: {
    name: 'Status Transitions',
    description: 'Test jobs changing states',
    transitions: [
      {
        from: createTestJob('job-1', 'pending'),
        to: createTestJob('job-1', 'processing'),
        expectedNotification: false,
      },
      {
        from: createTestJob('job-1', 'processing'),
        to: createTestJob('job-1', 'completed'),
        expectedNotification: 'success',
      },
      {
        from: createTestJob('job-2', 'processing'),
        to: { ...createTestJob('job-2', 'failed'), error_message: 'Test failure' },
        expectedNotification: 'error',
      },
    ],
  },
} as const;

// Performance test scenarios
export const PERFORMANCE_TESTS = {
  STRESS_TEST: {
    name: 'Stress Test',
    description: 'Many concurrent jobs',
    jobs: Array.from({ length: 50 }, (_, i) => 
      createTestJob(`stress-job-${i}`, i % 2 === 0 ? 'processing' : 'pending')
    ),
  },
  
  RAPID_CHANGES: {
    name: 'Rapid State Changes',
    description: 'Jobs changing states quickly',
    interval: POLLING_PRESETS.RAPID,
    jobs: [
      createTestJob('rapid-1', 'processing'),
      createTestJob('rapid-2', 'processing'),
    ],
  },
} as const;

// Utility functions for creating test data
function createTestJob(
  id: string, 
  status: ProcessingJob['status'],
  overrides: Partial<ProcessingJob> = {}
): ProcessingJob {
  return {
    id,
    image_path: `test-user/${id}-test-image.jpg`,
    status,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// Test utilities
export const TestUtils = {
  createTestJob,
  
  // Check if jobs should trigger polling
  shouldPoll: (jobs: ProcessingJob[]): boolean => {
    return jobs.some(job => job.status === 'pending' || job.status === 'processing');
  },
  
  // Get active job count
  getActiveJobCount: (jobs: ProcessingJob[]): number => {
    return jobs.filter(job => job.status === 'pending' || job.status === 'processing').length;
  },
  
  // Simulate status change
  simulateStatusChange: (
    previousJobs: ProcessingJob[], 
    newJobs: ProcessingJob[]
  ): { jobId: string; oldStatus: string; newStatus: string; changed: boolean }[] => {
    return newJobs.map(newJob => {
      const oldJob = previousJobs.find(j => j.id === newJob.id);
      return {
        jobId: newJob.id,
        oldStatus: oldJob?.status || 'none',
        newStatus: newJob.status,
        changed: Boolean(oldJob && oldJob.status !== newJob.status),
      };
    });
  },
  
  // Create a realistic job progression
  createJobProgression: (jobId: string): ProcessingJob[] => [
    createTestJob(jobId, 'pending'),
    createTestJob(jobId, 'processing'),
    createTestJob(jobId, 'completed'),
  ],
  
  // Environment variable helpers
  setTestPollingInterval: (intervalMs: number): string => {
    return intervalMs.toString();
  },
  
  setTestDebugMode: (enabled: boolean): string => {
    return enabled.toString();
  },
};

// Quick test configurations for .env.local
export const ENV_CONFIGS = {
  DEVELOPMENT: {
    NEXT_PUBLIC_POLLING_INTERVAL_MS: POLLING_PRESETS.FAST.toString(),
    NEXT_PUBLIC_POLLING_DEBUG: 'true',
  },
  
  PRODUCTION: {
    NEXT_PUBLIC_POLLING_INTERVAL_MS: POLLING_PRESETS.NORMAL.toString(),
    NEXT_PUBLIC_POLLING_DEBUG: 'false',
  },
  
  TESTING: {
    NEXT_PUBLIC_POLLING_INTERVAL_MS: POLLING_PRESETS.RAPID.toString(),
    NEXT_PUBLIC_POLLING_DEBUG: 'true',
  },
  
  SLOW_NETWORK: {
    NEXT_PUBLIC_POLLING_INTERVAL_MS: POLLING_PRESETS.SLOW.toString(),
    NEXT_PUBLIC_POLLING_DEBUG: 'true',
  },
} as const;

// Export everything for easy importing
export {
  createTestJob,
};