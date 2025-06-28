"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useGlobal } from '@/lib/context/GlobalContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Download, Share2, Trash2, Loader2, FileIcon, AlertCircle, CheckCircle, Copy, Wand2, X, ExternalLink } from 'lucide-react';
import { createSPASassClient } from '@/lib/supabase/client';
import { FileObject } from '@supabase/storage-js';

import { getProcessingJobs, type ProcessingJob } from '@/app/actions/jobs';

// Polling configuration
const POLLING_INTERVAL = parseInt(process.env.NEXT_PUBLIC_POLLING_INTERVAL_MS || '3000');
const POLLING_DEBUG = process.env.NEXT_PUBLIC_POLLING_DEBUG === 'true';

export default function FileManagementPage() {
    const { user, deductCreditsOptimistic, optimisticCredits } = useGlobal();
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
    const [cancellingJobs, setCancellingJobs] = useState<Set<string>>(new Set());
    const previousJobsRef = useRef<ProcessingJob[]>([]);
    const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
    const [selectedImageName, setSelectedImageName] = useState<string>('');
    const [selectedImageFilename, setSelectedImageFilename] = useState<string>('');

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
            
            // Sort files by creation date (newest first)
            const sortedFiles = (data || []).sort((a, b) => {
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
                        } else if (currentJob.status === 'failed') {
                            setError(`Restoration failed: ${currentJob.error_message || 'Unknown error'}`);
                        }
                    }
                });
            }
            
            previousJobsRef.current = jobs;
            setProcessingJobs(jobs);
        } catch (err) {
            console.error('Error loading processing jobs:', err);
        }
    }, [user?.id]);


    useEffect(() => {
        if (user?.id) {
            loadFiles();
            refreshJobs();
        }
    }, [user?.id, loadFiles, refreshJobs]);

    // Smart polling: only when active jobs exist
    useEffect(() => {
        if (!user?.id) return;

        const hasActiveJobs = processingJobs.some(job => 
            job.status === 'pending' || job.status === 'processing'
        );
        
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
    }, [processingJobs.some(job => job.status === 'pending' || job.status === 'processing'), user?.id, refreshJobs]);

    const handleFileUpload = useCallback(async (file: File) => {
        if (!user?.id) return;
        try {
            setUploading(true);
            setError('');

            const supabase = await createSPASassClient();
            const { error } = await supabase.uploadFile(user.id, file.name, file);

            if (error) throw error;

            await loadFiles();
            setSuccess('File uploaded successfully');
        } catch (err) {
            setError('Failed to upload file');
            console.error('Error uploading file:', err);
        } finally {
            setUploading(false);
        }
    }, [user?.id, loadFiles]);


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
        try {
            setRestoringFiles(prev => new Set([...prev, filename]));
            setError('');

            // Deduct credit optimistically for instant UI feedback
            const creditDeductionSuccess = await deductCreditsOptimistic(1);
            if (!creditDeductionSuccess) {
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
            
            setSuccess('Photo restoration started! The result will appear automatically when ready.');
            await refreshJobs(); // Load the new job once, then polling takes over
        } catch (err) {
            console.error('Error starting restoration:', err);
            setError(err instanceof Error ? err.message : 'Failed to start photo restoration');
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
            
            // result_url now always contains a complete URL (either our public URL or external Replicate URL)
            window.open(job.result_url, '_blank');
        } catch (err) {
            console.error('Error viewing restored image:', err);
            setError('Failed to view restored image');
        }
    };

    const handleShareRestoredImage = async (job: ProcessingJob) => {
        try {
            if (!job.result_url) return;
            
            setError('');
            
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
            } else {
                // External URL - use directly (though this is less common now)
                setShareUrl(job.result_url);
                setSelectedJob(job);
            }
        } catch (err) {
            console.error('Error sharing restored image:', err);
            setError('Failed to generate share link');
        }
    };

    // Check if a job can be cancelled (must be at least 10 seconds old)
    const isJobCancellable = (job: ProcessingJob): boolean => {
        if (!job.started_at) return false;
        const tenSecondsAgo = new Date(Date.now() - 10 * 1000);
        return new Date(job.started_at) < tenSecondsAgo;
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
        <div className="space-y-6 p-6">
            <Card>
                <CardHeader>
                    <CardTitle>File Management</CardTitle>
                    <CardDescription>Upload, generate, download, and share your restorations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4"/>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="mb-4">
                            <CheckCircle className="h-4 w-4"/>
                            <AlertDescription>{success}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex items-center justify-center w-full">
                        <label
                            className={`w-full flex flex-col items-center px-4 py-6 bg-white rounded-lg shadow-lg tracking-wide border-2 cursor-pointer transition-colors ${
                                isDragging
                                    ? 'border-primary-500 border-dashed bg-primary-50'
                                    : 'border-primary-600 hover:bg-primary-50'
                            }`}
                            onDragEnter={handleDragEnter}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <Upload className="w-8 h-8"/>
                            <span className="mt-2 text-base">
                                {uploading
                                    ? 'Uploading...'
                                    : isDragging
                                        ? 'Drop your file here'
                                        : 'Drag and drop or click to select a file (max 50mb)'}
                            </span>
                            <input
                                type="file"
                                className="hidden"
                                onChange={handleInputChange}
                                disabled={uploading}
                            />
                        </label>
                    </div>

                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary-600"/>
                        </div>
                    )}
                    
                    {!loading && files.length === 0 ? (
                        <div className="text-center py-12">
                            <FileIcon className="mx-auto h-12 w-12 text-gray-400 mb-4"/>
                            <p className="text-gray-500 text-lg">No files uploaded yet</p>
                            <p className="text-gray-400 text-sm">Upload your first photo to get started</p>
                        </div>
                    ) : !loading && (
                        <>
                            {/* Section Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">Your Photos</h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {files.length} {files.length === 1 ? 'photo' : 'photos'} uploaded
                                    </p>
                                </div>
                                <Link 
                                    href="/app/history" 
                                    className="inline-flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    View Gallery
                                    <ExternalLink className="ml-2 h-4 w-4" />
                                </Link>
                            </div>
                        </>
                    )}
                    
                    {!loading && files.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {files.map((file) => {
                                const filename = file.name;
                                const cleanName = cleanFilename(filename);
                                const previewUrl = imageUrls[filename];
                                const associatedJob = processingJobs.find(job => 
                                    job.image_path === `${user!.id}/${filename}`
                                );
                                
                                // Priority: restored image → original preview → null
                                const thumbnailUrl = associatedJob?.result_url || previewUrl;
                                
                                return (
                                    <div
                                        key={filename}
                                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group"
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
                                                <img
                                                    src={thumbnailUrl}
                                                    alt={cleanName}
                                                    className={`w-full h-full object-cover hover:scale-105 transition-all duration-200 ${
                                                        associatedJob?.status === 'processing' || restoringFiles.has(filename) 
                                                            ? 'blur-sm scale-105' 
                                                            : ''
                                                    }`}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <FileIcon className="h-12 w-12 text-gray-400"/>
                                                </div>
                                            )}
                                            
                                            {/* Processing Overlay */}
                                            {(associatedJob?.status === 'processing' || restoringFiles.has(filename)) && (
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
                                            
                                            {/* Action Overlay */}
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleRestorePhoto(filename)}
                                                        disabled={restoringFiles.has(filename) || (optimisticCredits ?? 0) <= 0 || associatedJob?.status === 'processing'}
                                                        className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title={
                                                            (optimisticCredits ?? 0) <= 0 
                                                                ? "You need 1 credit to restore this photo"
                                                                : associatedJob?.status === 'processing'
                                                                    ? "Restoration in progress..."
                                                                    : restoringFiles.has(filename) 
                                                                        ? "Starting restoration..." 
                                                                        : "Restore Photo (1 credit)"
                                                        }
                                                    >
                                                        {restoringFiles.has(filename) ? (
                                                            <Loader2 className="h-4 w-4 text-purple-600 animate-spin"/>
                                                        ) : (
                                                            <Wand2 className="h-4 w-4 text-purple-600"/>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownload(filename)}
                                                        className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                                                        title="Download Original"
                                                    >
                                                        <Download className="h-4 w-4 text-blue-600"/>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setFileToDelete(filename);
                                                            setShowDeleteDialog(true);
                                                        }}
                                                        className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600"/>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Card Footer */}
                                        <div className="p-4">
                                            <h3 className="font-medium text-gray-900 truncate" title={cleanName}>
                                                {cleanName}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Uploaded {new Date(file.created_at || '').toLocaleDateString()}
                                            </p>
                                            
                                            {/* Restoration Result Actions */}
                                            {associatedJob?.status === 'completed' && associatedJob.result_url && (
                                                <div className="mt-3 flex space-x-2">
                                                    <button
                                                        onClick={() => handleViewRestoredImage(associatedJob)}
                                                        className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
                                                    >
                                                        <CheckCircle className="h-4 w-4"/>
                                                        <span>View Result</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleShareRestoredImage(associatedJob)}
                                                        className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center"
                                                        title="Share Restored Image"
                                                    >
                                                        <Share2 className="h-4 w-4"/>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Debug info only */}
                    {POLLING_DEBUG && processingJobs.length > 0 && (
                        <div className="mt-8 text-center">
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
                                    <img
                                        src={selectedImageUrl}
                                        alt={selectedImageName}
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
                                            const filename = selectedJob.image_path.split('/').pop() || '';
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
                </CardContent>
            </Card>
        </div>
    );
}