'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
      title: 'Upload Your Photo',
      description: 'Simply drag and drop your old or damaged photo into our intuitive uploader.'
    },
    {
      icon: '🔍',
      title: 'AI Analysis',
      description: 'Our advanced AI analyzes damage, colors, and details in seconds.'
    },
    {
      icon: '🛠️',
      title: 'Smart Restoration',
      description: 'Intelligent algorithms repair scratches, restore colors, and enhance clarity.'
    },
    {
      icon: '🎨',
      title: 'Color Enhancement',
      description: 'Bring faded photos back to life with natural, vibrant colors.'
    },
    {
      icon: '🔎',
      title: 'Detail Sharpening',
      description: 'Upscale to HD while preserving authentic details and textures.'
    },
    {
      icon: '📥',
      title: 'Download & Share',
      description: 'Get your restored photo ready to print or share with family.'
    }
  ];

  const testimonials = [
    {
      quote: "Finally got around to scanning all those old family photos. The restoration was incredible, my mom couldn&apos;t believe how clear they turned out.",
      name: "Sarah M.",
      initials: "SM"
    },
    {
      quote: "I was amazed how it brought my grandma&apos;s wedding photo back to life – looks like it was taken yesterday!",
      name: "Mike R.",
      initials: "MR"
    },
    {
      quote: "Found a box of old Polaroids in the attic. Turned the best ones into canvas prints for the living room, they look fantastic.",
      name: "Lisa T.",
      initials: "LT"
    },
    {
      quote: "This app saved my wedding photos from water damage. Amazing results!",
      name: "John D.",
      initials: "JD"
    },
    {
      quote: "Turned my grandfather&apos;s war photos into treasures for my kids.",
      name: "Emily S.",
      initials: "ES"
    },
    {
      quote: "Super easy to use, and the HD upscaling is incredible!",
      name: "Robert L.",
      initials: "RL"
    }
  ];

  const [current, setCurrent] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    setIsMobile(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const visibleCount = isMobile ? 1 : 3;
  const slideWidth = 100 / visibleCount;
  const maxSlides = testimonials.length - visibleCount;

  const handleNext = () => setCurrent((prev) => (prev + 1 > maxSlides ? 0 : prev + 1));
  const handlePrev = () => setCurrent((prev) => (prev - 1 < 0 ? maxSlides : prev - 1));


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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {/* Subtle CSS grid background, no image needed */}
          </motion.div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left side - Content */}
              <div className="text-center lg:text-left">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                  Restore <span className="text-orange-600">Old or Damaged Photos</span><br /> in HD
                </h1>
                <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl lg:max-w-none">
                  Transform damaged, faded, or low-quality photos into stunning HD images with professional AI restoration technology.
                </p>
                
                {/* Social Proof */}
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-1">
                      <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white"></div>
                      <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                      <div className="w-6 h-6 bg-purple-500 rounded-full border-2 border-white"></div>
                    </div>
                    <span>Thousands of happy families</span>
                  </div>
                  <div className="hidden sm:block w-1 h-1 bg-gray-300 rounded-full"></div>
                  <span>⚡ Instant results</span>
                  <div className="hidden sm:block w-1 h-1 bg-gray-300 rounded-full"></div>
                  <span>🔒 Your photos stay private</span>
                </div>

                {/* CTA for users with accounts or as fallback */}
                <div className="mt-16">
                  <StartRestoringButton variant="hero" className="w-auto" />
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
                            className="absolute inset-0 w-full h-full opacity-0 cursor-grab active:cursor-grabbing"
                          />
                        </div>
                      </div>
                      <div className="text-center">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2">Historic Moment</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Scratches and tears repaired</p>
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
                            className="absolute inset-0 w-full h-full opacity-0 cursor-grab active:cursor-grabbing"
                          />
                        </div>
                      </div>
                      <div className="text-center">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2">Classic Memory</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Age damage removed</p>
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
                Join thousands who&apos;ve rediscovered their family history through crystal-clear restorations
              </p>
            </motion.div>
            {mounted ? (
              <div className="relative">
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
                    {testimonials.map((testimonial, index) => (
                      <motion.div 
                        key={index}
                        variants={testimonialVariants}
                        className={`flex-shrink-0 px-2 ${isMobile ? 'w-full' : 'w-1/3'}`}
                      >
                        <div className="text-center bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
                          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-2xl">
                            {testimonial.initials}
                          </div>
                          <div className="flex justify-center mb-6">
                            <div className="flex space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3 .921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784 .57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81 .588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                          <blockquote className="text-gray-700 italic mb-6 text-lg leading-relaxed">
                            {testimonial.quote}
                          </blockquote>
                          <div className="text-gray-500 font-medium">— {testimonial.name}</div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
                <div className="flex justify-center mt-6 space-x-4">
                  <button 
                    onClick={handlePrev}
                    className="bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 transition-colors"
                  >
                    Prev
                  </button>
                  <button 
                    onClick={handleNext}
                    className="bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 transition-colors"
                  >
                    Next
                  </button>
                </div>
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
              Try Free Demo Now
            </motion.a>
          </div>
        </section>


        <motion.section initial={{opacity:0, y:50}} whileInView={{opacity:1, y:0}} transition={{duration:0.8}} id="faq" className="py-20">
          <FAQSection />
        </motion.section>

        {/* Footer with subtle animation */}
        <footer className="py-12 bg-gray-900 text-gray-300">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="container mx-auto px-4"
          >
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <Logo color="white" />
                <p className="mt-4 text-sm">Reviving memories, one photo at a time.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Company</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/legal/terms-of-service" className="hover:text-orange-400">Terms</Link></li>
                  <li><Link href="/legal/privacy-notice" className="hover:text-orange-400">Privacy</Link></li>
                  <li><Link href="/legal/refund-policy" className="hover:text-orange-400">Refunds</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Support</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="#faq" className="hover:text-orange-400">FAQ</Link></li>
                  <li><a href="mailto:support@example.com" className="hover:text-orange-400">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Follow Us</h4>
                <div className="flex space-x-4">
                  <a href="#" className="hover:text-orange-400"><Facebook size={20} /></a>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
              © {new Date().getFullYear()} PhotoRestorationHD. All rights reserved.
            </div>
          </motion.div>
        </footer>
      </div>
  );
}