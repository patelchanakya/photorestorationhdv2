"use client";
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useGlobal } from '@/lib/context/GlobalContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Download, Share2, Trash2, Loader2, FileIcon, AlertCircle, CheckCircle, Copy, Wand2, ExternalLink, X, HelpCircle } from 'lucide-react';
import { createSPASassClient } from '@/lib/supabase/client';
import { FileObject } from '@supabase/storage-js';

import { getProcessingJobs, type ProcessingJob } from '@/app/actions/jobs';
import ProminentCreditsDisplay from '@/components/ProminentCreditsDisplay';
import UserStatsDisplay from '@/components/UserStatsDisplay';
import HowItWorksTour from '@/components/HowItWorksTour';
import CreditTestPanel from '@/components/CreditTestPanel';
import Confetti from '@/components/Confetti';
import PurchaseModal from '@/components/PurchaseModal';
import { usePostHog } from 'posthog-js/react';

// Polling configuration
const POLLING_INTERVAL = parseInt(process.env.NEXT_PUBLIC_POLLING_INTERVAL_MS || '1200');
const POLLING_DEBUG = process.env.NEXT_PUBLIC_POLLING_DEBUG === 'true';

export default function FileManagementPage() {
    const { user, deductCreditsOptimistic, optimisticCredits } = useGlobal();
    const posthog = usePostHog();
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
    const [restoringFiles, setRestoringFiles] = useState<Set<string>>(new Set());
    const [showConfetti, setShowConfetti] = useState(false);
    const [cancellingJobs, setCancellingJobs] = useState<Set<string>>(new Set());
    const previousJobsRef = useRef<ProcessingJob[]>([]);
    const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
    const [selectedImageName, setSelectedImageName] = useState<string>('');
    const [selectedImageFilename, setSelectedImageFilename] = useState<string>('');
    const [showTour, setShowTour] = useState(false);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);

    // Track page view
    useEffect(() => {
        if (posthog) {
            posthog.capture('storage_page_viewed');
        }
    }, [posthog]);

    // Utility function to clean up filenames for display
    const cleanFilename = (filename: string) => {
        const nameOnly = filename.split('/').pop() || '';
        // Remove timestamp suffix: _YYYY-MM-DD_HH-MM-SS
        return nameOnly.replace(/_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\./, '.');
    };

    // Generate preview URL for an image
    const generatePreviewUrl = useCallback(async (filename: string) => {
        if (!user?.id) return null;
        try {
            const supabase = await createSPASassClient();
            const { data, error } = await supabase.shareFile(user.id, filename, 3600); // 1 hour
            if (error) throw error;
            return data.signedUrl;
        } catch (err) {
            console.error('Error generating preview URL:', err);
            return null;
        }
    }, [user?.id]);

    // Load preview URLs for all files
    const loadImagePreviews = useCallback(async (fileList: FileObject[]) => {
        const urls: Record<string, string> = {};
        for (const file of fileList) {
            const url = await generatePreviewUrl(file.name);
            if (url) {
                urls[file.name] = url;
            }
        }
        setImageUrls(urls);
    }, [generatePreviewUrl]);

    const loadFiles = useCallback(async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            setError('');
            const supabase = await createSPASassClient();
            const { data, error } = await supabase.getFiles(user.id);

            if (error) throw error;
            
            // Filter files to only show today's uploads and sort by creation date (newest first)
            const today = new Date().toDateString();
            const todayFiles = (data || []).filter(file => {
                if (!file.created_at) return false;
                const fileDate = new Date(file.created_at).toDateString();
                return fileDate === today;
            });
            
            const sortedFiles = todayFiles.sort((a, b) => {
                const dateA = new Date(a.created_at || '').getTime();
                const dateB = new Date(b.created_at || '').getTime();
                return dateB - dateA; // Newest first
            });
            
            setFiles(sortedFiles);
            
            // Load image previews
            if (sortedFiles.length > 0) {
                await loadImagePreviews(sortedFiles);
            }
        } catch (err) {
            setError('Failed to load files');
            console.error('Error loading files:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.id, loadImagePreviews]);

    const refreshJobs = useCallback(async () => {
        if (!user?.id) return;
        try {
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
    const hasActiveJobs = useMemo(() => processingJobs.some(j => j.status === 'pending' || j.status === 'processing'), [processingJobs]);

    // Smart polling: only when active jobs exist
    useEffect(() => {
        if (!user?.id) return;

        if (!hasActiveJobs) {
            if (POLLING_DEBUG) console.log('No active jobs, no polling needed');
            return;
        }

        const activeJobCount = processingJobs.filter(j => j.status === 'pending' || j.status === 'processing').length;
        if (POLLING_DEBUG) console.log(`Starting smart polling for ${activeJobCount} active jobs (interval: ${POLLING_INTERVAL}ms)`);

        const interval = setInterval(() => {
            if (POLLING_DEBUG) console.log('Polling for job updates...');
            refreshJobs();
        }, POLLING_INTERVAL);

        return () => {
            if (POLLING_DEBUG) console.log('Stopping polling - cleanup');
            clearInterval(interval);
        };
    }, [hasActiveJobs, processingJobs, user?.id, refreshJobs]);

    const handleFileUpload = useCallback(async (file: File) => {
        if (!user?.id) return;
        
        // Track upload attempt
        if (posthog) {
            posthog.capture('photo_upload_attempted', {
                file_type: file.type,
                file_size_mb: Math.round((file.size / 1024 / 1024) * 100) / 100,
                file_name_length: file.name.length
            });
        }
        
        try {
            setUploading(true);
            setError('');

            const supabase = await createSPASassClient();
            const { error } = await supabase.uploadFile(user.id, file.name, file);

            if (error) throw error;

            await loadFiles();
            setSuccess('File uploaded successfully');
            
            // Track successful upload
            if (posthog) {
                posthog.capture('photo_upload_successful', {
                    file_type: file.type,
                    file_size_mb: Math.round((file.size / 1024 / 1024) * 100) / 100,
                    file_name_length: file.name.length
                });
            }
        } catch (err) {
            setError('Failed to upload file');
            console.error('Error uploading file:', err);
            
            // Track upload failure
            if (posthog) {
                posthog.capture('photo_upload_failed', {
                    file_type: file.type,
                    file_size_mb: Math.round((file.size / 1024 / 1024) * 100) / 100,
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


    const handleDownload = async (filename: string) => {
        try {
            setError('');
            const supabase = await createSPASassClient();
            const { data, error } = await supabase.shareFile(user!.id!, filename, 60, true);

            if (error) throw error;

            window.open(data.signedUrl, '_blank');
        } catch (err) {
            setError('Failed to download file');
            console.error('Error downloading file:', err);
        }
    };


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
        // Track restoration attempt
        if (posthog) {
            posthog.capture('photo_restoration_attempted', {
                filename_length: filename.length,
                current_credits: optimisticCredits || 0
            });
        }
        
        try {
            setRestoringFiles(prev => new Set([...prev, filename]));
            setError('');

            // Deduct credit optimistically for instant UI feedback
            const creditDeductionSuccess = await deductCreditsOptimistic(1);
            if (!creditDeductionSuccess) {
                // Track insufficient credits
                if (posthog) {
                    posthog.capture('photo_restoration_failed', {
                        reason: 'insufficient_credits',
                        current_credits: optimisticCredits || 0
                    });
                }
                throw new Error('You don\'t have enough credits to restore this photo. Please purchase more credits to continue.');
            }

            const response = await fetch('/api/restore-photo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user!.id,
                    image_path: `${user!.id}/${filename}`, // Construct full path: user_id/filename
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to start restoration');
            }

            const result = await response.json();
            console.log('Restoration started:', result);
            
            // Track successful restoration start
            if (posthog) {
                posthog.capture('photo_restoration_started', {
                    filename_length: filename.length,
                    credits_after: (optimisticCredits || 0) - 1,
                    job_id: result.job_id
                });
            }
            
            setSuccess('Photo restoration started! The result will appear automatically when ready.');
            await refreshJobs(); // Load the new job once, then polling takes over
        } catch (err) {
            console.error('Error starting restoration:', err);
            setError(err instanceof Error ? err.message : 'Failed to start photo restoration');
            
            // Track restoration failure
            if (posthog) {
                posthog.capture('photo_restoration_failed', {
                    reason: 'api_error',
                    error_message: err instanceof Error ? err.message : 'unknown_error',
                    current_credits: optimisticCredits || 0
                });
            }
        } finally {
            setRestoringFiles(prev => {
                const newSet = new Set(prev);
                newSet.delete(filename);
                return newSet;
            });
        }
    };

    const handleViewRestoredImage = async (job: ProcessingJob) => {
        try {
            if (!job.result_url) return;
            
            // Track image view
            if (posthog) {
                posthog.capture('restored_image_viewed', {
                    job_id: job.id,
                    is_external_url: !job.result_url.includes('/storage/v1/object/')
                });
            }
            
            // result_url now always contains a complete URL (either our public URL or external Replicate URL)
            window.open(job.result_url, '_blank');
        } catch (err) {
            console.error('Error viewing restored image:', err);
            setError('Failed to view restored image');
            
            // Track view failure
            if (posthog) {
                posthog.capture('restored_image_view_failed', {
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
                        <CardContent className="p-8">

                    <div className="flex items-center justify-center w-full">
                        <label
                            className={`relative w-full max-w-2xl flex flex-col items-center px-8 py-12 bg-white rounded-xl cursor-pointer transition-all duration-300 ease-in-out group ${
                                isDragging
                                    ? 'border-2 border-dashed border-orange-400 bg-orange-50 shadow-lg scale-105'
                                    : 'border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 hover:shadow-md'
                            }`}
                            onDragEnter={handleDragEnter}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            {/* Upload Icon */}
                            <div className={`p-4 rounded-full transition-all duration-300 ${
                                isDragging
                                    ? 'bg-orange-100 text-orange-600'
                                    : 'bg-gray-100 text-gray-500 group-hover:bg-orange-100 group-hover:text-orange-600'
                            }`}>
                                <Upload className="w-12 h-12"/>
                            </div>
                            
                            {/* Main Text */}
                            <div className="text-center mt-6 space-y-2">
                                <h3 className={`text-xl font-semibold transition-colors ${
                                    isDragging ? 'text-orange-700' : 'text-gray-700 group-hover:text-orange-700'
                                }`}>
                                    {uploading
                                        ? 'Uploading your image...'
                                        : isDragging
                                            ? 'Drop your image here'
                                            : 'Drop your image here'}
                                </h3>
                                
                                <p className={`text-sm transition-colors ${
                                    isDragging ? 'text-orange-600' : 'text-gray-500 group-hover:text-orange-600'
                                }`}>
                                    {!uploading && !isDragging && 'or click to browse your files'}
                                </p>
                                
                                {/* File format info */}
                                <div className="pt-3">
                                    <p className="text-xs text-gray-400">
                                        Supports JPG, PNG, and other image formats • Max 50MB
                                    </p>
                                </div>
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
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No photos uploaded today</h3>
                                <p className="text-gray-500 mb-6">Upload a photo above to get started with AI restoration</p>
                                <p className="text-sm text-gray-400">Visit the <Link href="/app/history" className="text-orange-600 hover:text-orange-700 font-medium">Gallery</Link> to see all your photos</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Files Section */}
                    {!loading && files.length > 0 && (
                        <Card className="border-0 shadow-lg bg-white" data-tour="photos-section">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl">Today&apos;s Photos</CardTitle>
                                        <CardDescription className="mt-1">
                                            {files.length} {files.length === 1 ? 'photo' : 'photos'} uploaded today
                                        </CardDescription>
                                    </div>
                                    <Link 
                                        href="/app/history" 
                                        className="inline-flex items-center px-4 py-2 text-sm bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg transition-colors font-medium"
                                        data-tour="gallery-link"
                                    >
                                        View Gallery
                                        <ExternalLink className="ml-2 h-4 w-4" />
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-6">
                            {files.map((file, index) => {
                                const filename = file.name;
                                const cleanName = cleanFilename(filename);
                                const previewUrl = imageUrls[filename];
                                const associatedJob = processingJobs.find(job => job.image_path === `${user!.id}/${filename}`);

                                // Determine which thumbnail to show
                                let thumbnailUrl: string | null = previewUrl; // default to original preview
                                if (associatedJob && associatedJob.status === 'completed' && associatedJob.result_url) {
                                    thumbnailUrl = associatedJob.result_url;
                                }
                                
                                return (
                                    <div
                                        key={filename}
                                        className="@container bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group"
                                    >
                                        {/* Image Preview */}
                                        <div 
                                            className="relative aspect-square bg-gray-100 cursor-pointer"
                                            onClick={() => {
                                                if (thumbnailUrl) {
                                                    setSelectedImageUrl(thumbnailUrl);
                                                    setSelectedImageName(cleanName);
                                                    setSelectedImageFilename(filename);
                                                }
                                            }}
                                        >
                                            {thumbnailUrl ? (
                                                <Image
                                                    src={thumbnailUrl}
                                                    alt={cleanName}
                                                    fill
                                                    sizes="(max-width:768px) 100vw, 33vw"
                                                    className={`object-cover hover:scale-105 transition-all duration-200 ${
                                                        associatedJob && (associatedJob.status === 'processing' || restoringFiles.has(filename)) ? 'blur-sm scale-105' : ''
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
                                            
                                            {/* Status Badge */}
                                            {associatedJob && (
                                                <div className="absolute top-2 right-2">
                                                    <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                                                        associatedJob.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        associatedJob.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                        associatedJob.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        associatedJob.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {associatedJob.status === 'processing' && (
                                                            <Loader2 className="h-3 w-3 animate-spin"/>
                                                        )}
                                                        <span>{associatedJob.status}</span>
                                                    </div>
                                                </div>
                                            )}
                                            
                                        </div>
                                        
                                        {/* Card Footer */}
                                        <div className="p-4">
                                            <h3 className="font-medium text-gray-900 truncate" title={cleanName}>
                                                {cleanName}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Uploaded {new Date(file.created_at || '').toLocaleDateString()}
                                            </p>
                                            
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
                                                        className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-orange-600"
                                                        data-tour={index === 0 ? "first-restore-button" : undefined}
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
                                                                <span>Restore</span>
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
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewRestoredImage(associatedJob);
                                                        }}
                                                        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
                                                    >
                                                        <CheckCircle className="h-4 w-4"/>
                                                        <span>View Restored Photo</span>
                                                    </button>
                                                ) : null}
                                                
                                                {/* Secondary Actions Row */}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDownload(filename);
                                                        }}
                                                        className="flex-1 px-2 lg:px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-1 lg:gap-2"
                                                        title="Download Original"
                                                    >
                                                        <Download className="h-4 w-4"/>
                                                        <span className="hidden @lg:inline">Download</span>
                                                    </button>
                                                    
                                                    {associatedJob && associatedJob.status === 'completed' && associatedJob.result_url && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleShareRestoredImage(associatedJob);
                                                            }}
                                                            className="flex-1 px-2 lg:px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-1 lg:gap-2"
                                                            title="Share Restored Photo"
                                                        >
                                                            <Share2 className="h-4 w-4"/>
                                                            <span className="hidden @lg:inline">Share</span>
                                                        </button>
                                                    )}
                                                    
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setFileToDelete(filename);
                                                            setShowDeleteDialog(true);
                                                        }}
                                                        className="flex-1 px-2 lg:px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium flex items-center justify-center gap-1 lg:gap-2"
                                                        title="Delete Photo"
                                                    >
                                                        <Trash2 className="h-4 w-4"/>
                                                        <span className="hidden @lg:inline">Delete</span>
                                                    </button>
                                                </div>
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
                                    {selectedImageFilename && (
                                        <Link
                                            href={`/app/history?highlight=${encodeURIComponent(selectedImageFilename)}`}
                                            className="inline-flex items-center px-3 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                                        >
                                            <ExternalLink className="h-4 w-4 mr-2"/>
                                            Go to Gallery
                                        </Link>
                                    )}
                                </div>
                            </DialogHeader>
                            <div className="p-6 pt-0">
                                {selectedImageUrl && (
                                    <Image
                                        src={selectedImageUrl}
                                        alt={selectedImageName}
                                        width={1200}
                                        height={800}
                                        className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                                    />
                                )}
                            </div>
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
                        onClose={() => setShowTour(false)} 
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
                    />
                </div>
            </div>
        </div>
    );
}