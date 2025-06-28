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

    const loadFiles = useCallback(async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            setError('');
            const supabase = await createSPASassClient();
            const { data, error } = await supabase.getFiles(user.id);

            if (error) throw error;
            setFiles(data || []);
        } catch (err) {
            setError('Failed to load files');
            console.error('Error loading files:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

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

                    <div className="space-y-4">
                        {loading && (
                            <div className="flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin"/>
                            </div>
                        )}
                        {files.length === 0 ? (
                            <p className="text-center text-gray-500">No files uploaded yet</p>
                        ) : (
                            files.map((file) => (
                                <div
                                    key={file.name}
                                    className="flex items-center justify-between p-4 bg-white rounded-lg border"
                                >
                                    <div className="flex items-center space-x-3">
                                        <FileIcon className="h-6 w-6 text-gray-400"/>
                                        <span className="font-medium">{file.name.split('/').pop()}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleRestorePhoto(file.name)}
                                            disabled={restoringFiles.has(file.name) || (optimisticCredits ?? 0) <= 0}
                                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title={
                                                (optimisticCredits ?? 0) <= 0 
                                                    ? "You need 1 credit to restore this photo. Please purchase more credits."
                                                    : restoringFiles.has(file.name) 
                                                        ? "Restoring in progress..." 
                                                        : "Restore Photo (1 credit)"
                                            }
                                        >
                                            {restoringFiles.has(file.name) ? (
                                                <Loader2 className="h-5 w-5 animate-spin"/>
                                            ) : (
                                                <Wand2 className="h-5 w-5"/>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleDownload(file.name)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                            title="Download"
                                        >
                                            <Download className="h-5 w-5"/>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setFileToDelete(file.name);
                                                setShowDeleteDialog(true);
                                            }}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-5 w-5"/>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Processing Jobs Section */}
                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Photo Restoration History</h3>
                            <div className="flex items-center space-x-4">
                                <Link 
                                    href="/app/history" 
                                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                    View All Photos
                                    <ExternalLink className="ml-1 h-4 w-4" />
                                </Link>
                                {POLLING_DEBUG && (
                                    <div className="text-xs text-gray-500 space-y-1">
                                        <div>Debug Mode: ON</div>
                                        <div>Polling Interval: {POLLING_INTERVAL}ms</div>
                                        <div>Active Jobs: {processingJobs.filter(j => j.status === 'pending' || j.status === 'processing').length}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-4">
                            {processingJobs.length === 0 ? (
                                <p className="text-center text-gray-500">No restoration jobs yet</p>
                            ) : (
                                processingJobs.map((job) => (
                                    <div
                                        key={job.id}
                                        className="flex items-center justify-between p-4 bg-white rounded-lg border"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <FileIcon className="h-6 w-6 text-gray-400"/>
                                            <div>
                                                <span className="font-medium">{job.image_path.split('/').pop()}</span>
                                                <div className="text-sm text-gray-500">
                                                    Created: {new Date(job.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2 ${
                                                job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                job.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                job.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                job.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {job.status === 'processing' && (
                                                    <Loader2 className="h-3 w-3 animate-spin"/>
                                                )}
                                                <span>{job.status}</span>
                                            </div>
                                            {(job.status === 'pending' || job.status === 'processing') && isJobCancellable(job) && (
                                                <button
                                                    onClick={() => handleCancelJob(job)}
                                                    disabled={cancellingJobs.has(job.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Cancel Job"
                                                >
                                                    {cancellingJobs.has(job.id) ? (
                                                        <Loader2 className="h-4 w-4 animate-spin"/>
                                                    ) : (
                                                        <X className="h-4 w-4"/>
                                                    )}
                                                </button>
                                            )}
                                            {job.status === 'completed' && job.result_url && (
                                                <>
                                                    <button
                                                        onClick={() => handleViewRestoredImage(job)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                        title="View Restored Image"
                                                    >
                                                        <Download className="h-5 w-5"/>
                                                    </button>
                                                    <button
                                                        onClick={() => handleShareRestoredImage(job)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                                                        title="Share Restored Image"
                                                    >
                                                        <Share2 className="h-5 w-5"/>
                                                    </button>
                                                </>
                                            )}
                                            {job.status === 'failed' && job.error_message && (
                                                <div title={job.error_message}>
                                                    <AlertCircle className="h-5 w-5 text-red-500"/>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

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