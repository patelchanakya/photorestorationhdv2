"use client";
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Upload, Image as ImageIcon } from 'lucide-react';
import FakeProcessingAnimation from './FakeProcessingAnimation';
import SignupOverlay from './SignupOverlay';

interface HomepageUploadDemoProps {
  className?: string;
}

const HomepageUploadDemo: React.FC<HomepageUploadDemoProps> = ({ className = '' }) => {
  const [demoFile, setDemoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSignupOverlay, setShowSignupOverlay] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('isProcessing changed to', isProcessing);
  }, [isProcessing]);

  console.log('HomepageUploadDemo render');

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setDemoFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Store file in localStorage for post-signup processing
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      localStorage.setItem('demo_file_data', result);
      localStorage.setItem('demo_file_name', file.name);
      localStorage.setItem('demo_file_type', file.type);
    };
    reader.readAsDataURL(file);

    // Start fake processing after a brief delay
    setTimeout(() => {
      setIsProcessing(true);
    }, 500);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  const handleProcessingComplete = () => {
    console.log('handleProcessingComplete called');
    setIsProcessing(false);
    setShowSignupOverlay(true);
  };

  const handleSignupSuccess = () => {
    // The signup process will handle the redirect to the app
    // where the stored demo file will be automatically processed
    setShowSignupOverlay(false);
  };

  const resetDemo = () => {
    setDemoFile(null);
    setPreviewUrl(null);
    setIsProcessing(false);
    setShowSignupOverlay(false);
    
    // Clean up preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    // Clear localStorage
    localStorage.removeItem('demo_file_data');
    localStorage.removeItem('demo_file_name');
    localStorage.removeItem('demo_file_type');
  };

  return (
    <div id="upload-demo" className={`relative w-full max-w-full ${className}`}>
      {/* Upload Zone */}
      {!demoFile && (
        <div
          className={`
            relative border-2 border-dashed rounded-2xl p-6 sm:p-8 md:p-10 text-center cursor-pointer
            transition-all duration-300 hover:border-primary-500 hover:bg-primary-50/50
            max-w-full mx-auto shadow-lg hover:shadow-xl
            ${isDragging 
              ? 'border-primary-500 bg-primary-50 scale-105 shadow-xl' 
              : 'border-primary-300 bg-white'
            }
          `}
          onDrop={handleDrop}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onClick={handleFileInputClick}
        >
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-center">
              <div className={`
                p-3 sm:p-4 rounded-full transition-all duration-300
                ${isDragging ? 'bg-primary-100' : 'bg-gray-100'}
              `}>
                <Upload className={`w-6 h-6 sm:w-8 sm:h-8 ${isDragging ? 'text-primary-600' : 'text-gray-600'}`} />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Drop your photo here to get started
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                See instant restoration results in seconds
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                Drag & drop or click to browse • 1 Free Photo 
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs text-gray-400">
              <span>JPG, PNG, WEBP</span>
              <span className="hidden sm:inline">•</span>
              <span className="whitespace-nowrap">Works on mobile</span>
              <span className="hidden sm:inline">•</span>
              <span>No subscription required</span>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      )}

      {/* Preview and Processing */}
      {demoFile && previewUrl && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden w-full max-w-full">
          {/* Image Preview */}
          <div className={`relative w-full ${isProcessing ? 'min-h-[300px] sm:min-h-[400px]' : 'aspect-video'} max-h-[500px] bg-gray-100`}>
            <Image
              src={previewUrl}
              alt="Demo upload preview"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 40vw"
            />
            
            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center overflow-hidden">
                <FakeProcessingAnimation 
                  onComplete={handleProcessingComplete}
                  filename={demoFile.name}
                />
              </div>
            )}
          </div>
          
          {/* File Info */}
          <div className="p-3 sm:p-4 border-t">
            <div className="flex items-center space-x-3">
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                  {demoFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(demoFile.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              {!isProcessing && !showSignupOverlay && (
                <button
                  onClick={resetDemo}
                  className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 flex-shrink-0"
                >
                  Try another
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Signup Overlay */}
      {showSignupOverlay && (
        <SignupOverlay
          isOpen={showSignupOverlay}
          onClose={() => setShowSignupOverlay(false)}
          onSignupSuccess={handleSignupSuccess}
          demoFileName={demoFile?.name}
        />
      )}
    </div>
  );
};

export default HomepageUploadDemo;