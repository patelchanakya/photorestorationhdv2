"use client";
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useGlobal } from '@/lib/context/GlobalContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Upload, Download, Share2, Trash2, Loader2, FileIcon, AlertCircle, CheckCircle, Copy, Wand2, ExternalLink, X, HelpCircle, MoreVertical, RefreshCw } from 'lucide-react';
import { createSPASassClient } from '@/lib/supabase/client';
import { FileObject } from '@supabase/storage-js';

import { getProcessingJobs, type ProcessingJob } from '@/app/actions/jobs';
import ProminentCreditsDisplay from '@/components/ProminentCreditsDisplay';
import UserStatsDisplay from '@/components/UserStatsDisplay';
import CreditTestPanel from '@/components/CreditTestPanel';
import { usePostHog } from 'posthog-js/react';
import { useSearchParams } from 'next/navigation';
import dynamicImport from 'next/dynamic';

const PurchaseModal = dynamicImport(() => import('@/components/PurchaseModal'), {
    loading: () => <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
        <span>Loading...</span>
    </div>
});

const HowItWorksTour = dynamicImport(() => import('@/components/HowItWorksTour'), {
    loading: () => null // No loading UI needed for tour
});

const Confetti = dynamicImport(() => import('@/components/Confetti'), {
    loading: () => null // No loading UI needed for confetti
});

// Polling configuration
const POLLING_INTERVAL = parseInt(process.env.NEXT_PUBLIC_POLLING_INTERVAL_MS || '1200');
const POLLING_DEBUG = process.env.NEXT_PUBLIC_POLLING_DEBUG === 'true';

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic'

export default function FileManagementPage() {
    // Force dynamic rendering by reading headers
    if (typeof window === 'undefined') {
        // This ensures the page is always server-rendered
        console.log('Server rendering storage page')
    }
    
    const { user, deductCreditsOptimistic, optimisticCredits } = useGlobal();
    const posthog = usePostHog();
    const searchParams = useSearchParams();
    const [files, setFiles] = useState<FileObject[]>([]);
    const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [shareUrl, setShareUrl] = useState('');
    const [selectedJob, setSelectedJob] = useState<ProcessingJob | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<string | null>(null);
    const [showCopiedMessage, setShowCopiedMessage] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [showUploadSuccess, setShowUploadSuccess] = useState(false);
    const [showUploadError, setShowUploadError] = useState(false);
    const [restoringFiles, setRestoringFiles] = useState<Set<string>>(new Set());
    const [showConfetti, setShowConfetti] = useState(false);
    const [cancellingJobs, setCancellingJobs] = useState<Set<string>>(new Set());
    const previousJobsRef = useRef<ProcessingJob[]>([]);
    const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
    // Removed thumbnails state - using original images for grid display
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
    const [selectedImageName, setSelectedImageName] = useState<string>('');
    const [selectedImageFilename, setSelectedImageFilename] = useState<string>('');
    const [showTour, setShowTour] = useState(false);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    
    // Demo mode state for tour
    const [demoMode, setDemoMode] = useState(false);
    

    // Track page view
    useEffect(() => {
        if (posthog) {
            posthog.capture('storage_page_viewed');
        }
    }, [posthog]);

    // Handle Stripe redirect parameters
    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        const successParam = searchParams.get('success');
        const cancelledParam = searchParams.get('cancelled');

        if (sessionId && successParam === 'true') {
            setSuccess('Payment successful! Your credits have been added to your account. You can now restore your photos!');
            
            // Track successful purchase completion
            if (posthog) {
                posthog.capture('credit_purchase_completed', {
                    session_id: sessionId,
                    payment_method: 'stripe',
                    page: 'storage'
                });
            }
            
            // Clear URL parameters
            window.history.replaceState({}, '', '/app/storage');
        } else if (cancelledParam === 'true') {
            setError('Payment was cancelled. No charges were made.');
            
            // Track purchase cancellation
            if (posthog) {
                posthog.capture('credit_purchase_cancelled', {
                    stage: 'stripe_checkout',
                    page: 'storage'
                });
            }
            
            // Clear URL parameters
            window.history.replaceState({}, '', '/app/storage');
        }
    }, [searchParams, posthog]);

    // Utility function to clean up filenames for display
    const cleanFilename = (filename: string) => {
        const nameOnly = filename.split('/').pop() || '';
        // Remove timestamp suffix: _YYYY-MM-DD_HH-MM-SS
        return nameOnly.replace(/_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\./, '.');
    };

    // Generate preview URL for an image - simplified, no caching
    const generatePreviewUrl = useCallback(async (filename: string) => {
        if (!user?.id) return null;
        try {
            const supabase = await createSPASassClient();
            const { data, error } = await supabase.shareFile(user.id, filename, 21600); // 6 hours
            if (error) throw error;
            return data.signedUrl;
        } catch (err) {
            console.error('Error generating preview URL:', err);
            return null;
        }
    }, [user?.id]);

    // Load image URLs for display - simplified, no thumbnails
    const loadImagePreviews = useCallback(async (fileList: FileObject[]) => {
        const urls: Record<string, string> = {};
        
        // Process files in parallel for better performance
        await Promise.all(fileList.map(async (file) => {
            try {
                // Get original file URL
                const originalUrl = await generatePreviewUrl(file.name);
                if (!originalUrl) return;
                
                urls[file.name] = originalUrl;
            } catch (err) {
                // If anything fails, skip this file (graceful degradation)
                console.warn(`Failed to load URLs for ${file.name}:`, err);
            }
        }));
        
        setImageUrls(urls); // Original URLs for both display and grid
    }, [generatePreviewUrl]);

    // Demo mode utilities
    const activateDemoMode = useCallback(() => {
        setDemoMode(true);
    }, []);

    const deactivateDemoMode = useCallback(() => {
        setDemoMode(false);
    }, []);

    const loadFiles = useCallback(async (forceRefresh = false) => {
        if (!user?.id) return;
        try {
            setLoading(true);
            setError('');
            
            console.log(`[STORAGE DEBUG] loadFiles called - force refresh: ${forceRefresh}`);
            
            const supabase = await createSPASassClient();
            const { data, error } = await supabase.getFiles(user.id);

            if (error) {
                console.error('[STORAGE DEBUG] getFiles error:', error);
                throw error;
            }
            
            console.log('[STORAGE DEBUG] Raw files data:', data?.length || 0, 'files');
            console.log('[STORAGE DEBUG] Files data:', data);
            
            // Simple: just use the data as-is, Supabase already sorts by created_at desc
            const files = data || [];
            
            console.log('[STORAGE DEBUG] Setting files:', files.length);
            setFiles(files);
            
            // Load image previews
            if (files.length > 0) {
                console.log('[STORAGE DEBUG] Loading image previews for', files.length, 'files');
                await loadImagePreviews(files);
            } else {
                console.log('[STORAGE DEBUG] No files to load previews for');
            }
        } catch (err) {
            setError('Failed to load files');
            console.error('[STORAGE DEBUG] Error loading files:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.id, loadImagePreviews]);

    const refreshJobs = useCallback(async () => {
        if (!user?.id) return;
        try {
            // NO CACHE - always fetch fresh job data
            console.log('[STORAGE DEBUG] refreshJobs called for user:', user.id);
            const jobs = await getProcessingJobs(user.id);
            
            // Check for status changes and show notifications
            if (previousJobsRef.current.length > 0) {
                jobs.forEach(currentJob => {
                    const previousJob = previousJobsRef.current.find(j => j.id === currentJob.id);
                    if (previousJob && previousJob.status !== currentJob.status) {
                        if (currentJob.status === 'completed') {
                            setSuccess('Photo restoration completed! Your restored image is ready.');
                            // Trigger confetti celebration
                            setShowConfetti(true);
                            setTimeout(() => setShowConfetti(false), 3000); // Hide after 3 seconds
                            
                            // Track successful restoration completion
                            if (posthog) {
                                const processingTime = currentJob.completed_at && currentJob.created_at 
                                    ? Math.round((new Date(currentJob.completed_at).getTime() - new Date(currentJob.created_at).getTime()) / 1000)
                                    : null;
                                    
                                posthog.capture('photo_restoration_completed', {
                                    job_id: currentJob.id,
                                    processing_time_seconds: processingTime,
                                    has_result_url: !!currentJob.result_url
                                });
                            }
                        } else if (currentJob.status === 'failed') {
                            setError(`Restoration failed: ${currentJob.error_message || 'Unknown error'}`);
                            
                            // Track restoration failure
                            if (posthog) {
                                posthog.capture('photo_restoration_job_failed', {
                                    job_id: currentJob.id,
                                    error_message: currentJob.error_message || 'unknown_error',
                                    previous_status: previousJob.status
                                });
                            }
                        }
                    }
                });
            }
            
            previousJobsRef.current = jobs;
            setProcessingJobs(jobs);
        } catch (err) {
            console.error('Error loading processing jobs:', err);
        }
    }, [user?.id, posthog]);


    useEffect(() => {
        if (user?.id) {
            loadFiles();
            refreshJobs();
        }
    }, [user?.id, loadFiles, refreshJobs]);

    // Compute if jobs are active
    const hasActiveJobs = useMemo(() => processingJobs?.some(j => j.status === 'pending' || j.status === 'processing') || false, [processingJobs]);

    // Exponential backoff polling: only when active jobs exist
    useEffect(() => {
        if (!user?.id) return;

        if (!hasActiveJobs) {
            if (POLLING_DEBUG) console.log('No active jobs, no polling needed');
            return;
        }

        const activeJobCount = processingJobs.filter(j => j.status === 'pending' || j.status === 'processing').length;
        if (POLLING_DEBUG) console.log(`Starting exponential backoff polling for ${activeJobCount} active jobs`);

        let pollCount = 0;
        let timeoutId: NodeJS.Timeout;

        const scheduleNextPoll = () => {
            // Exponential backoff: 2s → 3s → 4s → 5s → max 5s
            const intervals = [2000, 3000, 4000, 5000];
            const interval = intervals[Math.min(pollCount, intervals.length - 1)];
            
            if (POLLING_DEBUG) console.log(`Scheduling poll #${pollCount + 1} in ${interval}ms`);
            
            timeoutId = setTimeout(() => {
                if (POLLING_DEBUG) console.log(`Polling for job updates (attempt #${pollCount + 1})...`);
                refreshJobs();
                pollCount++;
                scheduleNextPoll();
            }, interval);
        };

        scheduleNextPoll();

        return () => {
            if (POLLING_DEBUG) console.log('Stopping exponential backoff polling - cleanup');
            clearTimeout(timeoutId);
        };
    }, [hasActiveJobs, processingJobs, user?.id, refreshJobs]);

    // Dual compression function for optimal storage and display
    const handleFileUpload = useCallback(async (file: File) => {
        if (!user?.id) return;
        
        try {
            setUploading(true);
            setError('');

            // Track upload attempt
            if (posthog) {
                posthog.capture('photo_upload_attempted', {
                    file_type: file.type,
                    original_size_mb: Math.round((file.size / 1024 / 1024) * 100) / 100,
                    file_name_length: file.name.length
                });
            }

            const supabase = await createSPASassClient();
            
            // Upload original file directly - no compression, no thumbnails
            const { error: originalError, data } = await supabase.uploadFile(user.id, file.name, file);
            if (originalError) throw originalError;
            
            const filename = data?.path?.split('/').pop();
            if (!filename) throw new Error('Failed to get filename from upload');

            // Add small delay to ensure Supabase storage is consistent
            await new Promise(resolve => setTimeout(resolve, 500));
            await loadFiles();
            
            // Verify the uploaded file appears in the list by checking storage directly
            const verifyClient = await createSPASassClient();
            const { data: verifyFiles } = await verifyClient.getFiles(user.id);
            console.log('Upload verification: Found', verifyFiles?.length || 0, 'files in storage');
            console.log('Upload verification: Looking for filename:', filename);
            
            const uploadedFile = verifyFiles?.find(f => f.name === filename);
            
            if (!uploadedFile) {
                console.warn('Upload verification FAILED: File not found in storage');
                console.warn('Available files:', verifyFiles?.map(f => f.name));
                setError('File uploaded but not visible. Please try refreshing the page.');
                return;
            } else {
                console.log('Upload verification SUCCESS: File found in storage');
            }
            
            // Show upload success
            setSuccess(`File uploaded successfully! Click restore on image below.`);
            setShowUploadSuccess(true);
            setTimeout(() => setShowUploadSuccess(false), 3000);
            
            // Track successful upload
            if (posthog) {
                posthog.capture('photo_upload_successful', {
                    file_type: file.type,
                    original_size_mb: Math.round((file.size / 1024 / 1024) * 100) / 100,
                    file_name_length: file.name.length,
                    uploaded_filename: filename
                });
            }
        } catch (err) {
            setError('Failed to upload file');
            setShowUploadError(true);
            setTimeout(() => setShowUploadError(false), 3000);
            console.error('Error uploading file:', err);
            
            // Track upload failure
            if (posthog) {
                posthog.capture('photo_upload_failed', {
                    file_type: file.type,
                    original_size_mb: Math.round((file.size / 1024 / 1024) * 100) / 100,
                    error_message: err instanceof Error ? err.message : 'unknown_error'
                });
            }
        } finally {
            setUploading(false);
        }
    }, [user?.id, loadFiles, posthog]);


    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = event.target.files;
        if (!fileList || fileList.length === 0) return;
        handleFileUpload(fileList[0]);
        event.target.value = '';
    };


    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    }, [handleFileUpload]);


    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);




    const handleDelete = async () => {
        if (!fileToDelete) return;

        try {
            setError('');
            const supabase = await createSPASassClient();
            const { error } = await supabase.deleteFile(user!.id!, fileToDelete);

            if (error) throw error;

            await loadFiles();
            setSuccess('File deleted successfully');
        } catch (err) {
            setError('Failed to delete file');
            console.error('Error deleting file:', err);
        } finally {
            setShowDeleteDialog(false);
            setFileToDelete(null);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setShowCopiedMessage(true);
            setTimeout(() => setShowCopiedMessage(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            setError('Failed to copy to clipboard');
        }
    };

    const handleRestorePhoto = async (filename: string) => {
        const requestId = Math.random().toString(36).substring(2, 15);
        const timestamp = new Date().toISOString();
        
        console.log(`🚀 [${timestamp}] [${requestId}] handleRestorePhoto called with filename:`, filename);
        console.log(`🚀 [${requestId}] User state:`, { 
            userId: user?.id, 
            hasUser: !!user,
            email: user?.email,
            userObjectKeys: user ? Object.keys(user) : []
        });
        console.log(`🚀 [${requestId}] Credits state:`, { optimisticCredits });
        console.log(`🚀 [${requestId}] Browser info:`, {
            userAgent: navigator.userAgent,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            language: navigator.language
        });
        
        // Track restoration attempt
        if (posthog) {
            posthog.capture('photo_restoration_attempted', {
                filename_length: filename.length,
                current_credits: optimisticCredits || 0,
                request_id: requestId
            });
        }
        
        try {
            setRestoringFiles(prev => new Set([...prev, filename]));
            setError('');

            console.log(`🚀 [${requestId}] Starting credit deduction...`);
            const creditStartTime = Date.now();
            // Deduct credit optimistically for instant UI feedback
            const creditDeductionSuccess = await deductCreditsOptimistic(1);
            const creditEndTime = Date.now();
            console.log(`🚀 [${requestId}] Credit deduction result:`, creditDeductionSuccess, `(took ${creditEndTime - creditStartTime}ms)`);
            
            if (!creditDeductionSuccess) {
                console.log(`❌ [${requestId}] Credit deduction failed - insufficient credits`);
                // Track insufficient credits
                if (posthog) {
                    posthog.capture('photo_restoration_failed', {
                        reason: 'insufficient_credits',
                        current_credits: optimisticCredits || 0,
                        request_id: requestId
                    });
                }
                throw new Error('You don\'t have enough credits to restore this photo. Please purchase more credits to continue.');
            }

            console.log(`🚀 [${requestId}] Making API call to /api/restore-photo...`);
            const apiPayload = {
                user_id: user!.id,
                image_path: `${user!.id}/${filename}`
            };
            console.log(`🚀 [${requestId}] Request payload:`, apiPayload);
            console.log(`🚀 [${requestId}] Current window.location:`, window.location.href);
            console.log(`🚀 [${requestId}] Document cookies present:`, document.cookie ? 'Yes' : 'No');

            const apiStartTime = Date.now();
            const response = await fetch('/api/restore-photo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(apiPayload),
            });

            const apiEndTime = Date.now();
            console.log(`🚀 [${requestId}] API response status:`, response.status);
            console.log(`🚀 [${requestId}] API response time:`, apiEndTime - apiStartTime, 'ms');
            console.log(`🚀 [${requestId}] API response headers:`, Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                console.log(`❌ [${requestId}] API response not ok, reading error...`);
                const errorData = await response.json();
                console.log(`❌ [${requestId}] API error data:`, errorData);
                console.log(`❌ [${requestId}] API error response full:`, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                    data: errorData
                });
                throw new Error(errorData.error || 'Failed to start restoration');
            }

            const result = await response.json();
            console.log(`✅ [${requestId}] API success result:`, result);
            console.log(`✅ [${requestId}] Restoration started:`, result);
            
            // Track successful restoration start
            if (posthog) {
                posthog.capture('photo_restoration_started', {
                    filename_length: filename.length,
                    credits_after: (optimisticCredits || 0) - 1,
                    job_id: result.job_id,
                    request_id: requestId
                });
            }
            
            setSuccess('Photo restoration started! The result will appear automatically when ready.');
            console.log(`🚀 [${requestId}] Refreshing jobs to load new job...`);
            await refreshJobs(); // Load the new job once, then polling takes over
            console.log(`✅ [${requestId}] Jobs refreshed successfully`);
        } catch (err) {
            console.error(`❌ [${requestId}] Error starting restoration:`, err);
            console.error(`❌ [${requestId}] Error stack:`, err instanceof Error ? err.stack : 'No stack available');
            console.error(`❌ [${requestId}] Error occurred at:`, new Date().toISOString());
            setError(err instanceof Error ? err.message : 'Failed to start photo restoration');
            
            // Track restoration failure
            if (posthog) {
                posthog.capture('photo_restoration_failed', {
                    reason: 'api_error',
                    error_message: err instanceof Error ? err.message : 'unknown_error',
                    current_credits: optimisticCredits || 0,
                    request_id: requestId
                });
            }
        } finally {
            console.log(`🚀 [${requestId}] Cleaning up restoring files state...`);
            setRestoringFiles(prev => {
                const newSet = new Set(prev);
                newSet.delete(filename);
                return newSet;
            });
        }
    };


    const handleDownloadRestoredImage = async (job: ProcessingJob) => {
        try {
            if (!job.result_url) return;
            
            setError('');
            
            // Track download attempt
            if (posthog) {
                posthog.capture('restored_image_download_attempted', {
                    job_id: job.id,
                    is_external_url: !job.result_url.includes('/storage/v1/object/')
                });
            }
            
            // Use blob download method for better reliability
            const response = await fetch(job.result_url);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `restored-${job.id}.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            // Track successful download
            if (posthog) {
                posthog.capture('restored_image_download_successful', {
                    job_id: job.id,
                    download_method: 'blob'
                });
            }
            
        } catch (err) {
            console.error('Error downloading restored image:', err);
            setError('Failed to download restored image');
            
            // Track download failure
            if (posthog) {
                posthog.capture('restored_image_download_failed', {
                    job_id: job.id,
                    error_message: err instanceof Error ? err.message : 'unknown_error'
                });
            }
        }
    };

    const handleShareRestoredImage = async (job: ProcessingJob) => {
        try {
            if (!job.result_url) return;
            
            setError('');
            
            // Track share attempt
            if (posthog) {
                posthog.capture('restored_image_share_attempted', {
                    job_id: job.id,
                    is_external_url: !job.result_url.includes('/storage/v1/object/')
                });
            }
            
            // Extract the file path from the public URL to create a signed URL for sharing
            if (job.result_url.includes('/storage/v1/object/public/restored-images/')) {
                // Our bucket - create signed URL for sharing
                const pathPart = job.result_url.split('/storage/v1/object/public/restored-images/')[1];
                
                console.log('Extracted path for sharing:', pathPart);
                console.log('Full result_url:', job.result_url);
                
                const supabase = await createSPASassClient();
                const { data, error } = await supabase.shareRestoredImage(pathPart, 24 * 60 * 60); // 24 hours
                
                if (error) throw error;
                
                setShareUrl(data.signedUrl);
                setSelectedJob(job);
                
                // Track successful share link generation
                if (posthog) {
                    posthog.capture('restored_image_share_successful', {
                        job_id: job.id,
                        share_method: 'signed_url'
                    });
                }
            } else {
                // External URL - use directly (though this is less common now)
                setShareUrl(job.result_url);
                setSelectedJob(job);
                
                // Track direct URL sharing
                if (posthog) {
                    posthog.capture('restored_image_share_successful', {
                        job_id: job.id,
                        share_method: 'direct_url'
                    });
                }
            }
        } catch (err) {
            console.error('Error sharing restored image:', err);
            setError('Failed to generate share link');
            
            // Track share failure
            if (posthog) {
                posthog.capture('restored_image_share_failed', {
                    job_id: job.id,
                    error_message: err instanceof Error ? err.message : 'unknown_error'
                });
            }
        }
    };

    // Check if a job can be cancelled (must be at least 15 seconds old)
    const isJobCancellable = (job: ProcessingJob): boolean => {
        if (!job.created_at) return false;
        const fifteenSecondsAgo = new Date(Date.now() - 15 * 1000);
        return new Date(job.created_at) < fifteenSecondsAgo;
    };

    const handleCancelJob = async (job: ProcessingJob) => {
        try {
            setCancellingJobs(prev => new Set([...prev, job.id]));
            setError('');

            const response = await fetch('/api/cancel-job', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    job_id: job.id,
                    user_id: user!.id,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to cancel job');
            }

            setSuccess('Job cancelled successfully');
            await refreshJobs();
        } catch (err) {
            console.error('Error cancelling job:', err);
            setError(err instanceof Error ? err.message : 'Failed to cancel job');
        } finally {
            setCancellingJobs(prev => {
                const newSet = new Set(prev);
                newSet.delete(job.id);
                return newSet;
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section with Welcome Message */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-8 xl:gap-12">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mb-3">
                                Welcome back, {user?.email?.split('@')[0]}! 👋
                            </h1>
                            <p className="text-gray-600 mb-4 text-base sm:text-lg">
                                Ready to restore more memories? Your journey continues below.
                            </p>
                            {user?.id && (
                                <div className="mb-4">
                                    <UserStatsDisplay userId={user.id} />
                                </div>
                            )}
                            <button
                                onClick={() => setShowTour(true)}
                                className="inline-flex items-center px-3 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors font-medium"
                            >
                                <HelpCircle className="h-4 w-4 mr-2" />
                                How It Works
                            </button>
                        </div>
                        <div className="flex-shrink-0 xl:mt-0">
                            <div className="flex justify-center xl:justify-end">
                                <ProminentCreditsDisplay onBuyMore={() => setShowPurchaseModal(true)} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

                                            


            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">

            <CreditTestPanel />

                <div className="space-y-8">
                    {/* Alerts */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4"/>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert>
                            <CheckCircle className="h-4 w-4"/>
                            <AlertDescription>{success}</AlertDescription>
                        </Alert>
                    )}

                    {/* Upload Section */}
                    <Card className="border-0 shadow-xl bg-white" data-tour="upload-area">
                        <CardContent className="p-6">

                    <div className="flex items-center justify-center w-full">
                        <label
                            className={`relative w-full max-w-2xl flex flex-col items-center px-6 py-6 bg-white rounded-xl cursor-pointer transition-all duration-300 ease-in-out group ${
                                showUploadError
                                    ? 'border-2 border-dashed border-red-400 bg-red-50 shadow-lg scale-105'
                                    : showUploadSuccess
                                    ? 'border-2 border-dashed border-green-400 bg-green-50 shadow-lg scale-105'
                                    : isDragging
                                    ? 'border-2 border-dashed border-orange-400 bg-orange-50 shadow-lg scale-105'
                                    : 'border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 hover:shadow-md'
                            }`}
                            onDragEnter={handleDragEnter}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            {/* Upload Icon */}
                            <div className={`p-3 rounded-full transition-all duration-300 ${
                                showUploadError
                                    ? 'bg-red-100 text-red-600'
                                    : showUploadSuccess
                                    ? 'bg-green-100 text-green-600'
                                    : isDragging
                                    ? 'bg-orange-100 text-orange-600'
                                    : 'bg-gray-100 text-gray-500 group-hover:bg-orange-100 group-hover:text-orange-600'
                            }`}>
                                <Upload className="w-8 h-8"/>
                            </div>
                            
                            {/* Main Text */}
                            <div className="text-center mt-4">
                                <h3 className={`text-lg font-semibold transition-colors ${
                                    showUploadError ? 'text-red-700' : showUploadSuccess ? 'text-green-700' : isDragging ? 'text-orange-700' : 'text-gray-700 group-hover:text-orange-700'
                                }`}>
                                    {uploading
                                        ? 'Uploading your image...'
                                        : showUploadError
                                            ? 'Try again!'
                                            : showUploadSuccess
                                            ? 'Upload successful!'
                                            : isDragging
                                            ? 'Drop your image here'
                                            : 'Drop image here or click to browse'}
                                </h3>
                                
                                <p className="text-xs text-gray-400 mt-2">
                                    JPG, PNG • Max 50MB
                                </p>
                            </div>
                            
                            {/* Loading indicator */}
                            {uploading && (
                                <div className="mt-4">
                                    <div className="flex items-center space-x-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                                        <span className="text-sm text-orange-600">Processing...</span>
                                    </div>
                                </div>
                            )}
                            
                            <input
                                type="file"
                                className="hidden"
                                onChange={handleInputChange}
                                disabled={uploading}
                                accept="image/*"
                            />
                        </label>
                        </div>
                        </CardContent>
                    </Card>

                    
                    {/* Empty State */}
                    {!loading && files.length === 0 && (
                        <Card className="border-0 shadow-lg bg-white">
                            <CardContent className="text-center py-16">
                                <FileIcon className="mx-auto h-16 w-16 text-gray-300 mb-6"/>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No images uploaded</h3>
                                <p className="text-gray-500 mb-6">Upload a photo above to get started with photo restoration</p>
                                <Button 
                                    onClick={() => loadFiles(true)} 
                                    variant="outline" 
                                    size="sm" 
                                    className="mb-4"
                                    disabled={loading}
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh Files
                                </Button>
                                <p className="text-sm text-gray-400">Visit <Link href="/app/history" className="text-orange-600 hover:text-orange-700 font-medium" prefetch={false}>All Restorations</Link> to see all your photos</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Files Section */}
                    {!loading && (files.length > 0 || demoMode) && (
                        <Card className="border-0 shadow-lg bg-white" data-tour="photos-section">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl">Your Photos</CardTitle>
                                        <CardDescription className="mt-1">
                                            {demoMode ? 'Demo photo for tour walkthrough' : `${files.length} ${files.length === 1 ? 'photo' : 'photos'} uploaded`}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={() => loadFiles(true)}
                                            disabled={loading}
                                            variant="outline"
                                            size="sm"
                                            className="text-xs sm:text-sm"
                                        >
                                            {loading ? (
                                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                            ) : (
                                                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                                            )}
                                            <span className="ml-1 sm:ml-2">Refresh</span>
                                        </Button>
                                        <Link 
                                            href="/app/history" 
                                            className="inline-flex items-center px-3 py-2 text-xs sm:text-sm bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg transition-colors font-medium"
                                            data-tour="gallery-link"
                                            prefetch={false}
                                        >
                                            <span className="hidden sm:inline">View All Restorations</span>
                                            <span className="sm:hidden">View All</span>
                                            <ExternalLink className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                                        </Link>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-6">
                            
                            {/* Demo photo card */}
                            {demoMode && (
                                <div className="relative group bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                                    <div className="relative aspect-square bg-gray-100 cursor-pointer">
                                        <Image
                                            src="/showcase/before1.webp"
                                            alt="Demo vintage photo"
                                            fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                    </div>
                                    
                                    <div className="p-4">
                                        <h3 className="font-medium text-gray-900 truncate" title="Demo Vintage Photo">
                                            Demo Vintage Photo
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Demo for tour walkthrough
                                        </p>
                                        
                                        <div className="mt-3 space-y-2">
                                            <button
                                                disabled
                                                className="w-full px-4 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed opacity-50 text-sm font-medium flex items-center justify-center space-x-2"
                                                data-tour="first-restore-button"
                                                title="Demo file - Upload a real photo to restore"
                                            >
                                                <Wand2 className="h-4 w-4"/>
                                                <span>Demo - Upload to Restore</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Real uploaded files */}
                            {files.map((file, index) => {
                                const filename = file.name;
                                const cleanName = cleanFilename(filename);
                                const fullUrl = imageUrls[filename];
                                const associatedJob = processingJobs.find(job => job.image_path === `${user!.id}/${filename}`);

                                // Determine which image to show (restored result takes priority)
                                let displayUrl: string | null = fullUrl; // Use original for grid
                                let modalUrl: string = fullUrl; // Use original for modal
                                
                                if (associatedJob && associatedJob.status === 'completed' && associatedJob.result_url) {
                                    displayUrl = associatedJob.result_url; // Show restored result if available
                                    modalUrl = associatedJob.result_url; // Use restored result for modal too
                                }
                                
                                return (
                                    <div
                                        key={filename}
                                        className="@container bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-200 group"
                                    >
                                        {/* Image Preview */}
                                        <div 
                                            className={`relative h-48 bg-gray-100 ${
                                                // Disable click during restoration
                                                (associatedJob && (associatedJob.status === 'processing' || associatedJob.status === 'pending')) || restoringFiles.has(filename) 
                                                    ? 'cursor-not-allowed' 
                                                    : 'cursor-pointer'
                                            }`}
                                            onClick={() => {
                                                // Prevent modal from opening during restoration
                                                if ((associatedJob && (associatedJob.status === 'processing' || associatedJob.status === 'pending')) || restoringFiles.has(filename)) {
                                                    return;
                                                }
                                                if (modalUrl) {
                                                    setSelectedImageUrl(modalUrl);
                                                    setSelectedImageName(cleanName);
                                                    setSelectedImageFilename(filename);
                                                }
                                            }}
                                        >
                                            {displayUrl ? (
                                                <Image
                                                    src={displayUrl}
                                                    alt={cleanName}
                                                    fill
                                                    sizes="(max-width:768px) 100vw, 33vw"
                                                    priority={index < 3} // Priority for first 3 images
                                                    className={`object-contain transition-all duration-200 ${
                                                        associatedJob && (associatedJob.status === 'processing' || restoringFiles.has(filename)) ? 'blur-sm' : ''
                                                    }`}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <FileIcon className="h-12 w-12 text-gray-400"/>
                                                </div>
                                            )}
                                            
                                            {/* Processing Overlay */}
                                            {associatedJob && (associatedJob.status === 'processing' || restoringFiles.has(filename)) && (
                                                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                                    <div className="text-center text-white">
                                                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2"/>
                                                        <p className="text-sm font-medium">
                                                            {restoringFiles.has(filename) ? 'Starting...' : 'Restoring'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Hover Actions Menu - Only show for completed restorations */}
                                            {associatedJob && associatedJob.status === 'completed' && associatedJob.result_url && (
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button 
                                                                size="sm" 
                                                                variant="secondary"
                                                                className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuItem 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDownloadRestoredImage(associatedJob);
                                                                }}
                                                            >
                                                                <Download className="h-4 w-4 mr-2" />
                                                                Download
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleShareRestoredImage(associatedJob);
                                                                }}
                                                            >
                                                                <Share2 className="h-4 w-4 mr-2" />
                                                                Share
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    try {
                                                                        setError('');
                                                                        const supabase = await createSPASassClient();
                                                                        const { error } = await supabase.deleteFile(user!.id!, filename);
                                                                        if (error) throw error;
                                                                        await loadFiles();
                                                                        setSuccess('File deleted successfully');
                                                                    } catch (err) {
                                                                        setError('Failed to delete file');
                                                                        console.error('Error deleting file:', err);
                                                                    }
                                                                }}
                                                                className="text-gray-600 focus:text-gray-700"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            )}
                                            
                                            {/* Overlay Actions for Newly Uploaded Images (Pre-Restoration) */}
                                            {(!associatedJob || associatedJob.status === 'failed' || associatedJob.status === 'cancelled') && (
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                try {
                                                                    setError('');
                                                                    const supabase = await createSPASassClient();
                                                                    const { error } = await supabase.deleteFile(user!.id!, filename);
                                                                    if (error) throw error;
                                                                    await loadFiles();
                                                                    setSuccess('File deleted successfully');
                                                                } catch (err) {
                                                                    setError('Failed to delete file');
                                                                    console.error('Error deleting file:', err);
                                                                }
                                                            }}
                                                            className="p-2 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
                                                            title="Delete Image"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                        
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Trigger file input for replacement
                                                                const input = document.createElement('input');
                                                                input.type = 'file';
                                                                input.accept = 'image/*';
                                                                input.onchange = async (event) => {
                                                                    const file = (event.target as HTMLInputElement).files?.[0];
                                                                    if (file) {
                                                                        try {
                                                                            setError('');
                                                                            // Delete old file first
                                                                            const supabase = await createSPASassClient();
                                                                            await supabase.deleteFile(user!.id!, filename);
                                                                            // Then upload new file using existing upload logic
                                                                            await handleFileUpload(file);
                                                                        } catch (err) {
                                                                            setError('Failed to replace image');
                                                                            console.error('Error replacing image:', err);
                                                                        }
                                                                    }
                                                                };
                                                                input.click();
                                                            }}
                                                            className="p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-all duration-200 shadow-sm hover:shadow-md"
                                                            title="Replace Image"
                                                        >
                                                            <RefreshCw className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            
                                        </div>
                                        
                                        {/* Card Footer */}
                                        <div className="p-4">
                                            <h3 className="font-medium text-gray-900 truncate" title={cleanName}>
                                                {cleanName}
                                            </h3>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-sm text-gray-500">
                                                    Uploaded {new Date(file.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                {/* Status Badge - Only show for completed, failed, or cancelled */}
                                                {associatedJob && associatedJob.status !== 'pending' && associatedJob.status !== 'processing' && (
                                                    <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                                                        associatedJob.status === 'completed' ? 'bg-orange-500 text-white' :
                                                        associatedJob.status === 'cancelled' ? 'bg-gray-100 text-gray-600' :
                                                        'bg-red-100 text-red-700' // for failed status
                                                    }`}>
                                                        <span>{associatedJob.status === 'completed' ? 'restored' : associatedJob.status}</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Primary Action Button */}
                                            <div className="mt-3 space-y-2">
                                                {/* Show different buttons based on job status */}
                                                {!associatedJob || associatedJob.status === 'failed' || associatedJob.status === 'cancelled' ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRestorePhoto(filename);
                                                        }}
                                                        disabled={restoringFiles.has(filename) || (optimisticCredits ?? 0) <= 0}
                                                        className="w-full px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200 text-sm font-medium flex items-center justify-center space-x-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-orange-500"
                                                        data-tour={index === 0 && !demoMode ? "first-restore-button" : undefined}
                                                    >
                                                        {restoringFiles.has(filename) ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 animate-spin"/>
                                                                <span>Starting Restoration...</span>
                                                            </>
                                                        ) : (optimisticCredits ?? 0) <= 0 ? (
                                                            <>
                                                                <Wand2 className="h-4 w-4"/>
                                                                <span>Need Credits to Restore</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Wand2 className="h-4 w-4"/>
                                                                <span>Restore Image</span>
                                                                <span className="text-xs bg-orange-500 px-2 py-0.5 rounded-full">1 credit</span>
                                                            </>
                                                        )}
                                                    </button>
                                                ) : associatedJob.status === 'pending' || associatedJob.status === 'processing' ? (
                                                    <div className="space-y-2">
                                                        <div className="w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium flex items-center justify-center space-x-2">
                                                            <Loader2 className="h-4 w-4 animate-spin"/>
                                                            <span>
                                                                {associatedJob.status === 'pending' ? 'Queued for Processing...' : 'Restoring Photo...'}
                                                            </span>
                                                        </div>
                                                        {associatedJob.status === 'processing' && isJobCancellable(associatedJob) && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCancelJob(associatedJob);
                                                                }}
                                                                disabled={cancellingJobs.has(associatedJob.id)}
                                                                className="w-full px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium flex items-center justify-center space-x-1 disabled:opacity-50"
                                                            >
                                                                {cancellingJobs.has(associatedJob.id) ? (
                                                                    <>
                                                                        <Loader2 className="h-4 w-4 animate-spin"/>
                                                                        <span>Cancelling...</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <X className="h-4 w-4"/>
                                                                        <span>Cancel & Refund</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : associatedJob && associatedJob.status === 'completed' && associatedJob.result_url ? (
                                                    <div className="space-y-2">
                                                        <Button
                                                            onClick={() => handleDownloadRestoredImage(associatedJob)}
                                                            className="w-full bg-green-600 hover:bg-green-700 text-white text-sm"
                                                        >
                                                            <Download className="h-4 w-4 mr-2" />
                                                            Download
                                                        </Button>
                                                    </div>
                                                ) : null}
                                                
                                            </div>
                                        </div>
                                    </div>
                                );
                                })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Debug info only */}
                    {POLLING_DEBUG && processingJobs.length > 0 && (
                        <div className="text-center">
                            <div className="text-xs text-gray-500 space-y-1 bg-yellow-50 p-3 rounded-lg border">
                                <div>Debug Mode: ON</div>
                                <div>Polling Interval: {POLLING_INTERVAL}ms</div>
                                <div>Active Jobs: {processingJobs.filter(j => j.status === 'pending' || j.status === 'processing').length}</div>
                            </div>
                        </div>
                    )}
                    {/* Image Modal */}
                    <Dialog open={Boolean(selectedImageUrl)} onOpenChange={() => {
                        setSelectedImageUrl(null);
                        setSelectedImageName('');
                        setSelectedImageFilename('');
                    }}>
                        <DialogContent className="max-w-4xl w-full p-0">
                            <DialogHeader className="p-6 pb-0">
                                <div className="flex items-center justify-between">
                                    <DialogTitle className="text-lg font-semibold">
                                        {selectedImageName}
                                    </DialogTitle>
                                </div>
                            </DialogHeader>
                            <div className="p-6 pt-0">
                                {selectedImageUrl && (
                                    <Image
                                        src={selectedImageUrl}
                                        alt={selectedImageName}
                                        width={1200}
                                        height={800}
                                        priority
                                        className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                                    />
                                )}
                            </div>
                            
                            {/* Modal Action Buttons */}
                            {selectedImageFilename && (
                                <div className="px-6 pb-6 pt-0">
                                    <div className="flex gap-3 justify-end border-t pt-4">
                                        <button
                                            onClick={() => {
                                                const associatedJob = processingJobs.find(job => job.image_path === `${user!.id}/${selectedImageFilename}`);
                                                if (associatedJob && associatedJob.status === 'completed') {
                                                    handleDownloadRestoredImage(associatedJob);
                                                }
                                            }}
                                            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200 text-sm font-medium flex items-center space-x-2 shadow-sm hover:shadow-md"
                                        >
                                            <Download className="h-4 w-4"/>
                                            <span>Download</span>
                                        </button>
                                        
                                        <button
                                            onClick={() => {
                                                const associatedJob = processingJobs.find(job => job.image_path === `${user!.id}/${selectedImageFilename}`);
                                                if (associatedJob && associatedJob.status === 'completed') {
                                                    handleShareRestoredImage(associatedJob);
                                                }
                                            }}
                                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 text-sm font-medium flex items-center space-x-2 shadow-sm hover:shadow-md"
                                        >
                                            <Share2 className="h-4 w-4"/>
                                            <span>Share</span>
                                        </button>
                                        
                                        <button
                                            onClick={async () => {
                                                try {
                                                    setError('');
                                                    const supabase = await createSPASassClient();
                                                    const { error } = await supabase.deleteFile(user!.id!, selectedImageFilename);
                                                    if (error) throw error;
                                                    await loadFiles();
                                                    setSuccess('File deleted successfully');
                                                    // Close modal after delete
                                                    setSelectedImageUrl(null);
                                                    setSelectedImageName('');
                                                    setSelectedImageFilename('');
                                                } catch (err) {
                                                    setError('Failed to delete file');
                                                    console.error('Error deleting file:', err);
                                                }
                                            }}
                                            className="px-4 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-all duration-200 text-sm font-medium flex items-center space-x-2 shadow-sm hover:shadow-md"
                                        >
                                            <Trash2 className="h-4 w-4"/>
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>

                    {/* Share Dialog */}
                    <Dialog open={Boolean(shareUrl)} onOpenChange={() => {
                        setShareUrl('');
                        setSelectedJob(null);
                    }}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-lg">
                                    {selectedJob ? 'Share Restored Image' : 'Share Image'}
                                </DialogTitle>
                                <DialogDescription>
                                    Copy the link below to share your {selectedJob ? 'restored' : ''} image. This link will expire in 24 hours.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="flex items-start space-x-2">
                                    <div className="flex-1">
                                        <textarea
                                            value={shareUrl}
                                            readOnly
                                            rows={3}
                                            className="w-full p-3 border rounded-lg bg-gray-50 text-sm font-mono cursor-pointer resize-none overflow-y-auto"
                                            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                                            style={{ height: '80px' }}
                                        />
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(shareUrl)}
                                        className="p-3 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors relative flex-shrink-0"
                                        title="Copy to clipboard"
                                    >
                                        <Copy className="h-4 w-4"/>
                                        {showCopiedMessage && (
                                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                                Copied!
                                            </span>
                                        )}
                                    </button>
                                </div>
                                {selectedJob && (
                                    <p className="text-sm text-gray-600">
                                        Original: {(() => {
                                            const filename = selectedJob?.image_path?.split('/').pop() ?? '';
                                            // Remove the timestamp suffix (format: _YYYY-MM-DD_HH-MM-SS)
                                            return filename.replace(/_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.[^.]+$/, '');
                                        })()}
                                    </p>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Delete Confirmation Dialog */}
                    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete File</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete this file? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    
                    {/* How It Works Tour */}
                    <HowItWorksTour 
                        isOpen={showTour} 
                        onClose={() => {
                            setShowTour(false);
                            if (demoMode) {
                                deactivateDemoMode();
                            }
                        }}
                        onActivateDemo={activateDemoMode}
                        onDeactivateDemo={deactivateDemoMode}
                        hasFiles={files.length > 0}
                    />
                    
                    {/* Confetti Animation */}
                    <Confetti active={showConfetti} />
                    
                    {/* Purchase Modal */}
                    <PurchaseModal
                        isOpen={showPurchaseModal}
                        onClose={() => setShowPurchaseModal(false)}
                        onPurchaseSuccess={() => {
                            setShowPurchaseModal(false);
                        }}
                        redirectPath="/app/storage"
                    />
                </div>
            </div>
        </div>
    );
}