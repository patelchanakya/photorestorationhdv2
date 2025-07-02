"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { ThemeExample } from '@/types/theme';

interface ThemedPhotoShowcaseProps {
  examples: ThemeExample[];
}

export default function ThemedPhotoShowcase({ examples }: ThemedPhotoShowcaseProps) {
  const [activeSliders, setActiveSliders] = useState<Record<string, number>>({});

  const handleSliderChange = (exampleId: string, value: number) => {
    setActiveSliders(prev => ({ ...prev, [exampleId]: value }));
  };

  return (
    <section className="py-24 bg-white" id="gallery">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">
            See the <span className="relative inline-block">
              <span className="text-primary-600 z-10 relative">transformation</span>
              <svg className="absolute left-0 right-0 bottom-0 w-full h-2 z-0" viewBox="0 0 200 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 8 Q100 15 195 8" stroke="#FF7A1A" strokeWidth="4" strokeLinecap="round"/>
              </svg>
            </span>
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Real results from real photos. Drag the slider to reveal the restoration magic.
          </p>
        </div>

        {/* Desktop Grid */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {examples.map((example, index) => {
            const sliderValue = activeSliders[example.id] || 50;
            return (
              <div key={example.id} className="group">
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 transform hover:scale-[1.02]">
                  <div className="mb-4 relative overflow-hidden rounded-lg aspect-square">
                    {/* Before/After Slider */}
                    <div className="relative w-full h-full">
                      <Image 
                        src={example.afterImage} 
                        alt={`${example.title} - After`}
                        fill
                        sizes="(max-width:768px) 100vw, 50vw"
                        priority={index === 0}
                        className="absolute inset-0 object-cover"
                      />
                      <div 
                        className="absolute inset-0 overflow-hidden"
                        style={{ clipPath: `inset(0 ${100 - sliderValue}% 0 0)` }}
                      >
                        <Image 
                          src={example.beforeImage} 
                          alt={`${example.title} - Before`}
                          fill
                          sizes="(max-width:768px) 100vw, 50vw"
                          priority={index === 0}
                          className="object-cover"
                        />
                      </div>
                      {/* Slider Line */}
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                        style={{ left: `${sliderValue}%` }}
                      />
                      {/* Slider Control */}
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sliderValue}
                        onChange={(e) => handleSliderChange(example.id, parseInt(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-grab active:cursor-grabbing"
                      />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 text-center">
                    {example.title}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Carousel */}
        <div className="lg:hidden">
          <div className="flex overflow-x-auto space-x-6 pb-6 snap-x snap-mandatory">
            {examples.map((example, index) => {
              const sliderValue = activeSliders[example.id] || 50;
              return (
                <div key={example.id} className="flex-shrink-0 w-80 snap-center">
                  <div className="bg-white rounded-2xl shadow-lg p-4">
                    <div className="mb-4 relative overflow-hidden rounded-lg aspect-square">
                      {/* Before/After Slider */}
                      <div className="relative w-full h-full">
                        <Image 
                          src={example.afterImage} 
                          alt={`${example.title} - After`}
                          fill
                          sizes="80vw"
                          priority={index === 0}
                          className="absolute inset-0 object-cover"
                        />
                        <div 
                          className="absolute inset-0 overflow-hidden"
                          style={{ clipPath: `inset(0 ${100 - sliderValue}% 0 0)` }}
                        >
                          <Image 
                            src={example.beforeImage} 
                            alt={`${example.title} - Before`}
                            fill
                            sizes="80vw"
                            priority={index === 0}
                            className="object-cover"
                          />
                        </div>
                        {/* Slider Line */}
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                          style={{ left: `${sliderValue}%` }}
                        />
                        {/* Slider Control */}
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={sliderValue}
                          onChange={(e) => handleSliderChange(example.id, parseInt(e.target.value))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-grab active:cursor-grabbing"
                        />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 text-center">
                      {example.title}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Mobile scroll indicator */}
          <div className="flex justify-center mt-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              <span>Swipe to see more</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}