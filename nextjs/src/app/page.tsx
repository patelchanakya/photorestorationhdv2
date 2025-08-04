'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Facebook } from 'lucide-react';
import AuthAwareButtons from '@/components/AuthAwareButtons';
import HomePricing from "@/components/HomePricing";
import FAQSection from '@/components/FAQSection';
import Logo from '@/components/Logo';
import StartRestoringButton from '@/components/StartRestoringButton';
import HomepageUploadDemo from '@/components/HomepageUploadDemo';
// import PromoBanner from '@/components/PromoBanner';
import Image from 'next/image';
import { motion } from 'framer-motion';

const itemVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const testimonialVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 }
};

export default function Home() {
  const [slider1Value, setSlider1Value] = useState(50);
  const [slider2Value, setSlider2Value] = useState(50);
  const [slider3Value, setSlider3Value] = useState(50);
  const [slider4Value, setSlider4Value] = useState(50);

  const steps = [
    {
      icon: '📤',
      title: 'Upload Your Memory',
      description: 'Bring us your water-damaged wedding photos, torn childhood pictures, or faded family portraits.'
    },
    {
      icon: '🔍',
      title: 'We Find Every Detail',
      description: 'Our AI spots every crack, stain, and faded area that needs attention in your precious photo.'
    },
    {
      icon: '🛠️',
      title: 'Repair the Damage',
      description: 'Remove scratches, fix tears, eliminate water stains, and restore missing pieces like magic.'
    },
    {
      icon: '🎨',
      title: 'Bring Back the Colors',
      description: 'Restore those vibrant wedding dress whites, rich skin tones, and beautiful background details.'
    },
    {
      icon: '🔎',
      title: 'Make It Crystal Clear',
      description: 'Transform blurry or small photos into sharp, high-resolution images perfect for printing.'
    },
    {
      icon: '📥',
      title: 'Share Your Story',
      description: 'Print for frames, share at family reunions, or surprise relatives with restored memories.'
    }
  ];

  const testimonials = [
    {
      quote: "Finally got around to scanning all those old family photos. The restoration was incredible, my mom couldn't believe how clear they turned out.",
      name: "Priya S.",
      initials: "PS"
    },
    {
      quote: "I was amazed how it brought my grandma's wedding photo back to life – looks like it was taken yesterday!",
      name: "Carlos R.",
      initials: "CR"
    },
    {
      quote: "Found a box of old Polaroids in the attic. Turned the best ones into canvas prints for the living room, they look fantastic.",
      name: "Rosalie T.",
      initials: "RT"
    },
    {
      quote: "This app saved my wedding photos from water damage. Amazing results!",
      name: "Ahmed D.",
      initials: "AD"
    },
    {
      quote: "My kids had drawn all over my parents' old wedding photos with crayon. I thought they were ruined forever, but this brought them back perfectly!",
      name: "Chen L.",
      initials: "CL"
    },
    {
      quote: "When dad passed, we only had one good photo for the funeral service, but it was so faded. This made it beautiful again for everyone to remember him by.",
      name: "Maya G.",
      initials: "MG"
    },
    {
      quote: "I'm totally addicted to restoring photos now! Started with my own family pics, now I help people in Facebook groups all the time. It's so rewarding.",
      name: "Jamal K.",
      initials: "JK"
    },
    {
      quote: "Been doing photo restoration as a hobby for years. This tool does in minutes what used to take me hours in Photoshop!",
      name: "Fatima W.",
      initials: "FW"
    },
    {
      quote: "Super easy to use, and the HD upscaling is incredible!",
      name: "Diego L.",
      initials: "DL"
    }
  ];

  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handleMount = () => {
      setTimeout(() => setMounted(true), 0);
    };
    
    handleMount();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    const handleMediaQueryChange = () => {
      setTimeout(() => setIsMobile(mediaQuery.matches), 0);
    };
    
    handleMediaQueryChange();

    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const visibleCount = isMobile ? 1 : 3;
  const slideWidth = 100 / visibleCount;
  const slides = [...testimonials, ...testimonials];  // Duplicate for infinite loop
  const [current, setCurrent] = useState(0);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (!mounted) return;
    const timer = setInterval(() => {
      setCurrent((prev) => {
        const next = prev + 1;
        if (next === testimonials.length) {
          return 0;  // Reset for loop
        }
        return next;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [mounted, testimonials.length]);

  const sliderRefs: React.RefObject<HTMLInputElement | null>[] = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // Helper to handle touch drag for a slider
  function handleSliderTouch(index: number, setValue: (value: number) => void) {
    return (e: React.TouchEvent<HTMLInputElement>) => {
      if (!sliderRefs[index].current) return;
      const rect = sliderRefs[index].current.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      let percent = (x / rect.width) * 100;
      percent = Math.max(0, Math.min(100, percent));
      setValue(Math.round(percent));
    };
  }

  return (
      <div className="min-h-screen">
        <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm z-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex-shrink-0">
                <Logo variant="nav" />
              </div>
              <div className="flex items-center space-x-4">
                {/* Desktop Menu */}
                <div className="hidden md:flex items-center space-x-8">
                  <Link href="#pricing" className="text-gray-600 hover:text-gray-900">
                    Pricing
                  </Link>
                </div>
                {/* Auth Button for both mobile and desktop */}
                <AuthAwareButtons variant="nav" />
              </div>
            </div>
          </div>
        </nav>

        {/* <PromoBanner className="mt-16" /> */}

        {/* Hero Section with subtle parallax */}
        <section className="relative pt-32 pb-24 overflow-hidden">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-orange-50 to-blue-50"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            {/* Subtle CSS grid background, no image needed */}
            {/* Animated orange radial gradient overlay for warmth */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 0.18, scale: 1 }}
              transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
              style={{
                background: 'radial-gradient(circle at 60% 40%, #ff7a1a 0%, transparent 70%)',
                zIndex: 1,
                filter: 'blur(8px)'
              }}
            />
            {/* Animated floating orange shadow blob */}
            <motion.div
              className="absolute left-1/4 top-1/3 w-96 h-96 rounded-full"
              style={{
                background: 'radial-gradient(circle, #ff7a1a66 0%, transparent 80%)',
                filter: 'blur(48px)',
                zIndex: 2
              }}
              initial={{ y: 0, opacity: 0.18 }}
              animate={{ y: [0, 30, 0], opacity: [0.18, 0.22, 0.18] }}
              transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            />
          </motion.div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left side - Content */}
              <div className="text-center lg:text-left">
                <motion.h1
                  className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                >
                  <span className="inline-block animate-float">
                    Restore <span className="text-orange-600">Old or Damaged Photos</span><br /> in HD
                  </span>
                </motion.h1>
                <motion.p
                  className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl lg:max-w-none"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                >
                  Transform damaged, faded, or low-quality photos into stunning HD images with professional AI restoration technology.
                </motion.p>
                
                {/* Enhanced Social Proof */}
                <motion.div 
                  className="mt-8 p-4 bg-gradient-to-r from-orange-50/80 to-blue-50/80 backdrop-blur-sm rounded-2xl border border-orange-100/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
                >
                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-6">
                    <div className="flex items-center space-x-3">
                      <a 
                        href="https://www.facebook.com/photorestorationhd/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                      >
                        <Facebook className="w-5 h-5 text-blue-600" />
                        <span className="text-sm text-gray-700">Find us in Facebook groups</span>
                      </a>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 bg-white/60 px-3 py-1.5 rounded-full">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium text-gray-700">Facial consistency</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white/60 px-3 py-1.5 rounded-full">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-xs font-medium text-gray-700">Instant results</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* CTA for users with accounts or as fallback */}
                <div className="mt-16 flex flex-col sm:flex-row items-center lg:items-center lg:justify-start gap-4">
                  <StartRestoringButton variant="hero" className="w-auto" />
                  <a 
                    href="https://apple.co/3J3jl2t" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block hover:opacity-90 transition-opacity"
                  >
                    <Image 
                      src="/app-store-badge.svg" 
                      alt="Download on the App Store"
                      width={120}
                      height={40}
                      className="h-[48px] w-auto"
                    />
                  </a>
                </div>
              </div>

              {/* Right side - Interactive Upload Demo */}
              <div className="order-first lg:order-last">
                <HomepageUploadDemo />
              </div>
            </div>

            {/* Interactive transformation showcase moved up */}
            <div className="mt-16">
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                  See the <span className="relative inline-block">
                    <span className="text-orange-600 z-10 relative">transformation</span>
                    <svg className="absolute left-0 right-0 bottom-0 w-full h-2 z-0" viewBox="0 0 200 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 8 Q100 15 195 8" stroke="#FF7A1A" strokeWidth="4" strokeLinecap="round"/>
                    </svg>
                  </span>
                </h2>
                <p className="text-gray-600 text-base sm:text-lg">Drag the slider to see the magic happen</p>
              </div>
              
              {/* Inline showcase with enhanced design */}
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 justify-items-center">
                  {/* Example 1 - Previously 3rd */}
                  <div className="group w-full max-w-xs sm:max-w-sm">
                    <div className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 p-4 sm:p-6 transform hover:scale-[1.02] border border-gray-100">
                      <div className="relative overflow-hidden rounded-2xl aspect-square mb-4">
                        <div className="relative w-full h-full">
                          <Image 
                            src="/showcase/after3.webp" 
                            alt="Restored vintage photo"
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            quality={60}
                            className="absolute inset-0 object-cover"
                            // No priority, lazy by default
                          />
                          <div 
                            className="absolute inset-0 overflow-hidden"
                            style={{ clipPath: `inset(0 ${100 - slider3Value}% 0 0)` }}
                          >
                            <Image 
                              src="/showcase/before3.webp" 
                              alt="Original damaged photo"
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                              quality={60}
                              className="object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div 
                            className="absolute top-0 bottom-0 w-1 bg-orange-500 shadow-lg"
                            style={{ left: `${slider3Value}%` }}
                          />
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={slider3Value}
                            onChange={(e) => setSlider3Value(parseInt(e.target.value))}
                            ref={sliderRefs[2]}
                            onTouchStart={e => e.stopPropagation()}
                            onTouchMove={handleSliderTouch(2, setSlider3Value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-grab active:cursor-grabbing"
                          />
                        </div>
                      </div>
                      <div className="text-center">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2">Family Memory</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Color and detail enhanced</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Example 2 - Previously 4th */}
                  <div className="group w-full max-w-xs sm:max-w-sm">
                    <div className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 p-4 sm:p-6 transform hover:scale-[1.02] border border-gray-100">
                      <div className="relative overflow-hidden rounded-2xl aspect-square mb-4">
                        <div className="relative w-full h-full">
                          <Image 
                            src="/showcase/after4.webp" 
                            alt="Restored old photograph"
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            quality={60}
                            className="absolute inset-0 object-cover"
                            loading="lazy"
                          />
                          <div 
                            className="absolute inset-0 overflow-hidden"
                            style={{ clipPath: `inset(0 ${100 - slider4Value}% 0 0)` }}
                          >
                            <Image 
                              src="/showcase/before4.webp" 
                              alt="Original weathered photograph"
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                              quality={60}
                              className="object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div 
                            className="absolute top-0 bottom-0 w-1 bg-orange-500 shadow-lg"
                            style={{ left: `${slider4Value}%` }}
                          />
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={slider4Value}
                            onChange={(e) => setSlider4Value(parseInt(e.target.value))}
                            ref={sliderRefs[3]}
                            onTouchStart={e => e.stopPropagation()}
                            onTouchMove={handleSliderTouch(3, setSlider4Value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-grab active:cursor-grabbing"
                          />
                        </div>
                      </div>
                      <div className="text-center">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2">Classic Memory</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Scratches and tears repaired</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Example 3 - Previously 1st */}
                  <div className="group w-full max-w-xs sm:max-w-sm">
                    <div className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 p-4 sm:p-6 transform hover:scale-[1.02] border border-gray-100">
                      <div className="relative overflow-hidden rounded-2xl aspect-square mb-4">
                        <div className="relative w-full h-full">
                          <Image 
                            src="/showcase/after1.webp" 
                            alt="Restored vintage portrait"
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            quality={60}
                            className="absolute inset-0 object-cover"
                            loading="lazy"
                          />
                          <div 
                            className="absolute inset-0 overflow-hidden"
                            style={{ clipPath: `inset(0 ${100 - slider1Value}% 0 0)` }}
                          >
                            <Image 
                              src="/showcase/before1.webp" 
                              alt="Original damaged portrait"
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                              quality={60}
                              className="object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div 
                            className="absolute top-0 bottom-0 w-1 bg-orange-500 shadow-lg"
                            style={{ left: `${slider1Value}%` }}
                          />
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={slider1Value}
                            onChange={(e) => setSlider1Value(parseInt(e.target.value))}
                            ref={sliderRefs[0]}
                            onTouchStart={e => e.stopPropagation()}
                            onTouchMove={handleSliderTouch(0, setSlider1Value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-grab active:cursor-grabbing"
                          />
                        </div>
                      </div>
                      <div className="text-center">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2">Vintage Portrait</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Cracks and fading restored</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Example 4 - Previously 2nd */}
                  <div className="group w-full max-w-xs sm:max-w-sm">
                    <div className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 p-4 sm:p-6 transform hover:scale-[1.02] border border-gray-100">
                      <div className="relative overflow-hidden rounded-2xl aspect-square mb-4">
                        <div className="relative w-full h-full">
                          <Image 
                            src="/showcase/after2.webp" 
                            alt="Restored family photo"
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            quality={60}
                            className="absolute inset-0 object-cover"
                            loading="lazy"
                          />
                          <div 
                            className="absolute inset-0 overflow-hidden"
                            style={{ clipPath: `inset(0 ${100 - slider2Value}% 0 0)` }}
                          >
                            <Image 
                              src="/showcase/before2.webp" 
                              alt="Original faded family photo"
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                              quality={60}
                              className="object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div 
                            className="absolute top-0 bottom-0 w-1 bg-orange-500 shadow-lg"
                            style={{ left: `${slider2Value}%` }}
                          />
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={slider2Value}
                            onChange={(e) => setSlider2Value(parseInt(e.target.value))}
                            ref={sliderRefs[1]}
                            onTouchStart={e => e.stopPropagation()}
                            onTouchMove={handleSliderTouch(1, setSlider2Value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-grab active:cursor-grabbing"
                          />
                        </div>
                      </div>
                      <div className="text-center">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2">Historic Moment</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Age damage removed</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced How It Works */}
        <section id="how-it-works" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl font-bold text-center mb-16 text-gray-900"
            >
              How Our AI Brings Your Photos Back to Life
            </motion.h2>
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-gray-50 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="text-4xl mb-4 text-orange-600">{step.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Testimonials with improved animations */}
        <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Loved by Families Worldwide
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Join thousands who&#39;ve rediscovered their family history through crystal-clear restorations
              </p>
            </motion.div>
            {mounted ? (
              <div className="relative overflow-hidden">
                <motion.div 
                  className="overflow-hidden"
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <motion.div 
                    className="flex"
                    animate={{ x: `-${current * slideWidth}%` }}
                    transition={{ ease: 'easeOut', duration: 0.5 }}
                  >
                    {slides.map((testimonial, index) => (
                      <motion.div 
                        key={index}
                        variants={testimonialVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                        className={`flex-shrink-0 px-4 ${isMobile ? 'w-full' : 'w-1/3'}`}
                      >
                        <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-orange-100 hover:border-orange-200 h-full">
                          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white font-semibold text-xl shadow-sm">
                            {testimonial.initials}
                          </div>
                          <div className="flex justify-center mb-4">
                            <div className="flex space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <svg key={i} className="w-5 h-5 text-orange-400 fill-current" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3 .921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784 .57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81 .588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                          <blockquote className="text-gray-700 text-base leading-relaxed mb-4 font-light italic">
                            {testimonial.quote}
                          </blockquote>
                          <div className="text-orange-600 font-medium text-sm text-center">— {testimonial.name}</div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              </div>
            ) : null}
          </div>
        </section>

        <HomePricing />

        {/* Enhanced CTA */}
        <section className="py-24 bg-orange-600 text-white relative overflow-hidden">
          <motion.div 
            className="absolute inset-0 opacity-10"
            style={{backgroundImage: 'url(/patterns/dots.svg)'}}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1 }}
          ></motion.div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-4xl font-bold mb-6">Ready to Revive Your Memories?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">Start with our free demo restoration today – no credit card required!</p>
            <motion.a href="#demo-upload" whileHover={{scale:1.05}} transition={{duration:0.3}} className="inline-block bg-white text-orange-600 font-bold py-4 px-8 rounded-full text-lg shadow-lg hover:shadow-xl">
              Start for Free Now
            </motion.a>
          </div>
        </section>


        <motion.section initial={{opacity:0, y:50}} whileInView={{opacity:1, y:0}} transition={{duration:0.8}} id="faq" className="py-20">
          <FAQSection />
        </motion.section>

        {/* Footer with subtle animation */}
        <footer
          className="py-16 text-gray-800 w-full"
          style={{
            background: 'linear-gradient(to top, #f97316 0%, #fb923c 40%, #ffedd5 80%, #ffffff 100%)',
            minHeight: '220px',
          }}
        >
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="container mx-auto px-4"
          >
            <div className="grid md:grid-cols-5 gap-8">
              <div>
                <Logo color="orange" />
                <p className="mt-4 text-sm">Reviving memories, one photo at a time.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/legal/terms-of-service" className="hover:text-orange-600">Terms</Link></li>
                  <li><Link href="/legal/privacy-notice" className="hover:text-orange-600">Privacy</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="#faq" className="hover:text-orange-600">FAQ</Link></li>
                  <li><a href="mailto:support@example.com" className="hover:text-orange-600">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Follow Us</h4>
                <div className="flex space-x-4">
                  <a href="#" className="hover:text-orange-600"><Facebook size={20} /></a>
                </div>
              </div>
              <div>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/wedding" className="hover:text-orange-600">Wedding Photo Restoration</Link></li>
                  <li><Link href="/funeral" className="hover:text-orange-600">Funeral Photo Restoration</Link></li>
                  <li><Link href="/vintage" className="hover:text-orange-600">Vintage Photo Restoration</Link></li>
                  <li><Link href="/family" className="hover:text-orange-600">Family Photo Restoration</Link></li>
                  <li><Link href="/military" className="hover:text-orange-600">Military Photo Restoration</Link></li>
                  <li><Link href="/antique" className="hover:text-orange-600">Antique Photo Restoration</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm">
              © {new Date().getFullYear()} PhotoRestorationHD. All rights reserved.
            </div>
          </motion.div>
        </footer>
      </div>
  );
}