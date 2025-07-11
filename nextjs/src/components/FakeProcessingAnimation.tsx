"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Eye, Palette, Focus } from 'lucide-react';

interface FakeProcessingAnimationProps {
  onComplete: () => void;
  filename?: string;
  duration?: number; // in milliseconds
}

interface ProcessingStep {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  duration: number; // percentage of total duration
}

const FakeProcessingAnimation: React.FC<FakeProcessingAnimationProps> = ({
  onComplete,
  filename = 'your photo',
  duration = 4000 // 4 seconds
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const steps: ProcessingStep[] = useMemo(() => [
    {
      id: 'analyzing',
      icon: Eye,
      label: 'Analyzing image',
      description: 'AI scanning for damage and artifacts',
      duration: 20 // 0-20%
    },
    {
      id: 'detecting',
      icon: Focus,
      label: 'Detecting damage',
      description: 'Identifying scratches, tears, and fading',
      duration: 25 // 20-45%
    },
    {
      id: 'enhancing',
      icon: Palette,
      label: 'Enhancing colors',
      description: 'Restoring original vibrancy and contrast',
      duration: 30 // 45-75%
    },
    {
      id: 'finalizing',
      icon: Sparkles,
      label: 'Finalizing restoration',
      description: 'Applying finishing touches and sharpening',
      duration: 25 // 75-100%
    }
  ], []);

  useEffect(() => {
    setTimeout(() => {
      setIsAnimating(true);
    }, 0);

    let cumulativeTime = 0;
    const timeouts: NodeJS.Timeout[] = [];

    steps.forEach((step, index) => {
      if (index > 0) {
        const timeout = setTimeout(() => setCurrentStep(index), cumulativeTime);
        timeouts.push(timeout);
      }
      cumulativeTime += (step.duration / 100) * duration;
    });

    const completeTimeout = setTimeout(() => {
      setIsComplete(true);
      setTimeout(onComplete, 800);
    }, duration);
    timeouts.push(completeTimeout);

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [duration, onComplete, steps]);

  const currentStepData = steps[currentStep];
  const CurrentIcon = currentStepData?.icon || Sparkles;

  return (
    <div className="text-center text-white p-4">
      {/* Main Processing Icon */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full blur-xl opacity-50 animate-pulse" />
          <div className="relative bg-white/20 backdrop-blur-sm rounded-full p-6 border border-white/30">
            <CurrentIcon className="w-10 h-10 text-white animate-pulse" />
          </div>
          <div className="absolute top-0 right-0">
            <Sparkles className="w-4 h-4 text-yellow-300 animate-bounce" />
          </div>
          <div className="absolute bottom-0 left-0">
            <Sparkles className="w-3 h-3 text-orange-300 animate-bounce delay-300" />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="bg-white/20 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-orange-400 to-orange-500 h-full rounded-full transition-all ease-linear"
            style={{ 
              width: isAnimating ? '100%' : '0%',
              transitionDuration: `${duration}ms`
            }}
          />
        </div>
        <div className="text-xs text-white/80 mt-1">
          {isComplete ? '100%' : 'Processing...'} complete
        </div>
      </div>

      {/* Current Step Info */}
      <div className="space-y-1">
        <h3 className="text-base font-semibold">
          {isComplete ? 'Restoration Complete!' : currentStepData?.label}
        </h3>
        <p className="text-xs text-white/80">
          {isComplete 
            ? `${filename} has been restored and is ready to view`
            : currentStepData?.description
          }
        </p>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-center space-x-2 mt-4">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep || (isComplete && index === currentStep);
          const StepIcon = step.icon;
          
          return (
            <div
              key={step.id}
              className={`
                flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-300
                ${isCompleted ? 'bg-white text-orange-600 border-white' : isActive ? 'bg-white/20 text-white border-white animate-pulse' : 'bg-transparent text-white/50 border-white/30'}
              `}
            >
              <StepIcon className="w-3 h-3" />
            </div>
          );
        })}
      </div>

      {/* Completion Message */}
      {isComplete && (
        <div className="mt-2 p-2 bg-white/10 rounded-lg border border-white/20">
          <p className="text-xs font-medium">
            🎉 Your photo has been enhanced with AI
          </p>
          <p className="text-2xs text-white/80 mt-0.5">
            Sign up to view and download your restored image
          </p>
        </div>
      )}
    </div>
  );
};

export default FakeProcessingAnimation;