import { Clock, Shield, Heart, Camera, History } from 'lucide-react';
import { ThemePageConfig } from '@/types/theme';

export const themeConfigs: Record<string, ThemePageConfig> = {
  wedding: {
    slug: 'wedding',
    metadata: {
      title: 'Wedding Photo Restoration - Preserve Your Special Day Forever',
      description: 'Restore damaged, faded, or low-quality wedding photos with AI-powered technology. Bring your precious wedding memories back to life in HD quality.',
      keywords: ['wedding photo restoration', 'wedding photo repair', 'vintage wedding photos', 'damaged wedding pictures', 'wedding photo enhancement'],
    },
    hero: {
      title: 'Preserve Your Wedding Memories Forever',
      subtitle: 'Restore damaged wedding photos to their original beauty',
      description: 'Transform faded, torn, or damaged wedding photos into stunning HD images. Whether it\'s your vintage wedding album or precious family wedding photos passed down through generations, our AI-powered restoration brings every detail back to life.',
    },
    features: [
      {
        icon: Heart,
        title: 'Preserve Love Stories',
        description: 'Restore wedding photos that tell your unique love story for future generations',
        color: 'text-pink-600'
      },
      {
        icon: Camera,
        title: 'Professional Quality',
        description: 'Transform vintage wedding photos to professional photography standards',
        color: 'text-purple-600'
      },
      {
        icon: Shield,
        title: 'Safe & Secure',
        description: 'Your precious wedding memories are protected with enterprise-grade security',
        color: 'text-blue-600'
      }
    ],
    testimonials: [
      {
        quote: "Found my grandparents' wedding photos in the attic - they were severely damaged. The restoration was incredible, now they're beautifully displayed in our home.",
        author: "Emily R.",
        rating: 5
      },
      {
        quote: "Our 1960s wedding photos were faded and torn. Now they look like they were taken yesterday. My children can finally see how beautiful their father looked on our wedding day.",
        author: "Margaret T.",
        rating: 5
      },
      {
        quote: "Restored our wedding album photos for our 50th anniversary. The quality was amazing - better than the originals!",
        author: "Robert & Helen M.",
        rating: 5
      }
    ],
    examples: [
      {
        id: 'wedding1',
        title: 'Vintage Wedding Portrait',
        beforeImage: '/showcase/before1.webp',
        afterImage: '/showcase/after1.webp',
      },
      {
        id: 'wedding2',
        title: 'Damaged Wedding Album Photo',
        beforeImage: '/showcase/before2.webp',
        afterImage: '/showcase/after2.webp',
      }
    ],
    ctaSection: {
      title: 'Ready to Restore Your Wedding Memories?',
      description: 'Join thousands of couples who have preserved their precious wedding photos for future generations'
    }
  },

  funeral: {
    slug: 'funeral',
    metadata: {
      title: 'Memorial Photo Restoration - Honor Your Loved Ones',
      description: 'Restore precious photos of loved ones for memorial services, obituaries, and remembrance. Professional-quality restoration with care and dignity.',
      keywords: ['memorial photo restoration', 'funeral photo repair', 'obituary photos', 'memorial service photos', 'remembrance photo restoration'],
    },
    hero: {
      title: 'Honor Your Loved Ones with Restored Memories',
      subtitle: 'Preserve precious photos for memorial services and remembrance',
      description: 'When celebrating the life of a loved one, every photo matters. Restore damaged, faded, or old photographs to create beautiful memorial displays, obituary photos, and keepsakes that honor their memory with dignity and love.',
    },
    features: [
      {
        icon: Heart,
        title: 'Dignified Restoration',
        description: 'Handle your precious memories with the care and respect they deserve',
        color: 'text-blue-600'
      },
      {
        icon: Clock,
        title: 'Quick Turnaround',
        description: 'Fast restoration service when you need memories ready for memorial services',
        color: 'text-green-600'
      },
      {
        icon: Shield,
        title: 'Compassionate Service',
        description: 'Trusted by families during their most important moments of remembrance',
        color: 'text-purple-600'
      }
    ],
    testimonials: [
      {
        quote: "When my father passed, we only had one damaged photo of him from his military service. The restoration brought back every detail - it was perfect for his memorial service.",
        author: "David K.",
        rating: 5
      },
      {
        quote: "Needed photos restored quickly for my mother's obituary. The service was fast, respectful, and the quality was exceptional during a difficult time.",
        author: "Susan L.",
        rating: 5
      },
      {
        quote: "Found old family photos to display at grandma's celebration of life. The restored photos brought smiles and wonderful memories to everyone.",
        author: "Maria G.",
        rating: 5
      }
    ],
    examples: [
      {
        id: 'memorial1',
        title: 'Military Service Portrait',
        beforeImage: '/showcase/before1.webp',
        afterImage: '/showcase/after1.webp',
      },
      {
        id: 'memorial2',
        title: 'Family Gathering Photo',
        beforeImage: '/showcase/before2.webp',
        afterImage: '/showcase/after2.webp',
      }
    ],
    ctaSection: {
      title: 'Preserve Their Memory with Dignity',
      description: 'Honor your loved ones with beautifully restored photos that celebrate their life and legacy'
    }
  },

  vintage: {
    slug: 'vintage',
    metadata: {
      title: 'Vintage Photo Restoration - Bring History Back to Life',
      description: 'Restore vintage and antique photographs with advanced AI technology. Preserve historical family photos and bring them back to their original glory.',
      keywords: ['vintage photo restoration', 'antique photo repair', 'old photo restoration', 'historical photo enhancement', 'family heritage photos'],
    },
    hero: {
      title: 'Bring Historical Photos Back to Life',
      subtitle: 'Restore vintage and antique photographs with stunning detail',
      description: 'Discover the hidden beauty in your vintage family photographs. Our advanced restoration technology can repair decades of damage, fade, and wear to reveal the stunning detail and beauty that time has hidden.',
    },
    features: [
      {
        icon: History,
        title: 'Preserve History',
        description: 'Restore historical family photos and preserve them for future generations',
        color: 'text-amber-600'
      },
      {
        icon: Camera,
        title: 'Reveal Hidden Details',
        description: 'Uncover details in vintage photos that have been lost to time and damage',
        color: 'text-green-600'
      },
      {
        icon: Shield,
        title: 'Museum Quality',
        description: 'Professional-grade restoration suitable for archival and display purposes',
        color: 'text-blue-600'
      }
    ],
    testimonials: [
      {
        quote: "Had a box of 1920s family photos that were severely faded. The restoration revealed details I never knew existed - incredible technology!",
        author: "Thomas B.",
        rating: 5
      },
      {
        quote: "My great-grandmother's portrait from 1895 was barely visible. Now it's a stunning centerpiece in our family room - the detail is amazing.",
        author: "Catherine W.",
        rating: 5
      },
      {
        quote: "Restored vintage photos from our family farm dating back to the 1930s. Now we can see the faces and memories clearly again.",
        author: "John H.",
        rating: 5
      }
    ],
    examples: [
      {
        id: 'vintage1',
        title: '1920s Family Portrait',
        beforeImage: '/showcase/before1.webp',
        afterImage: '/showcase/after1.webp',
      },
      {
        id: 'vintage2',
        title: 'Victorian Era Photograph',
        beforeImage: '/showcase/before2.webp',
        afterImage: '/showcase/after2.webp',
      }
    ],
    ctaSection: {
      title: 'Uncover Your Family\'s Hidden History',
      description: 'Restore vintage photographs and discover the beautiful details that time has hidden'
    }
  },

  family: {
    slug: 'family',
    metadata: {
      title: 'Family Photo Restoration - Preserve Precious Memories',
      description: 'Restore damaged family photos and preserve precious memories for generations. Professional AI-powered restoration for all your family photographs.',
      keywords: ['family photo restoration', 'family photo repair', 'childhood photos', 'family memories', 'generational photos'],
    },
    hero: {
      title: 'Preserve Your Family\'s Precious Memories',
      subtitle: 'Restore damaged family photos for generations to enjoy',
      description: 'From childhood photos to multi-generational family portraits, restore and preserve the precious moments that tell your family\'s story. Give new life to faded, damaged, or deteriorating family photographs.',
    },
    features: [
      {
        icon: Heart,
        title: 'Family Legacy',
        description: 'Preserve family memories and stories for future generations to cherish',
        color: 'text-red-600'
      },
      {
        icon: Camera,
        title: 'Childhood Memories',
        description: 'Restore precious childhood photos and family milestones with perfect clarity',
        color: 'text-blue-600'
      },
      {
        icon: Shield,
        title: 'Safe & Private',
        description: 'Your family photos are secure and private - only you can access them',
        color: 'text-green-600'
      }
    ],
    testimonials: [
      {
        quote: "Restored all my children's baby photos that were damaged in a flood. Now they look perfect again and the memories are preserved forever.",
        author: "Jennifer M.",
        rating: 5
      },
      {
        quote: "Found old family photos in my mother's attic - some dating back 60 years. The restoration brought back so many wonderful memories.",
        author: "Michael R.",
        rating: 5
      },
      {
        quote: "My daughter's first birthday photos were faded and torn. Now they're beautifully restored and displayed in her baby book.",
        author: "Amanda S.",
        rating: 5
      }
    ],
    examples: [
      {
        id: 'family1',
        title: 'Family Holiday Photo',
        beforeImage: '/showcase/before1.webp',
        afterImage: '/showcase/after1.webp',
      },
      {
        id: 'family2',
        title: 'Childhood Portrait',
        beforeImage: '/showcase/before2.webp',
        afterImage: '/showcase/after2.webp',
      }
    ],
    ctaSection: {
      title: 'Keep Your Family Memories Alive',
      description: 'Restore and preserve precious family photos that tell your unique story'
    }
  },

  military: {
    slug: 'military',
    metadata: {
      title: 'Military Photo Restoration - Honor Service & Sacrifice',
      description: 'Restore military service photos, wartime photographs, and veteran portraits. Preserve the legacy of service members with professional restoration.',
      keywords: ['military photo restoration', 'veteran photos', 'wartime photographs', 'service member photos', 'military history'],
    },
    hero: {
      title: 'Honor Military Service & Heritage',
      subtitle: 'Restore military photos and preserve the legacy of service',
      description: 'Honor the brave men and women who served by restoring their military photographs. From wartime service photos to veteran portraits, preserve these important pieces of military history and family heritage.',
    },
    features: [
      {
        icon: Shield,
        title: 'Honor Service',
        description: 'Restore military photos with the respect and dignity they deserve',
        color: 'text-blue-600'
      },
      {
        icon: History,
        title: 'Preserve History',
        description: 'Keep military history and family service records alive for future generations',
        color: 'text-green-600'
      },
      {
        icon: Heart,
        title: 'Memorial Quality',
        description: 'Perfect for memorial displays, military funerals, and family tributes',
        color: 'text-red-600'
      }
    ],
    testimonials: [
      {
        quote: "Restored my grandfather's WWII photos for his 95th birthday. He was moved to tears seeing his old unit photos in perfect clarity again.",
        author: "Steve P.",
        rating: 5
      },
      {
        quote: "Had my father's Vietnam War photos restored for his memorial service. The quality was exceptional and honored his service beautifully.",
        author: "Lisa K.",
        rating: 5
      },
      {
        quote: "Found my uncle's Korean War service photos in terrible condition. The restoration brought back every detail of his time in service.",
        author: "Robert T.",
        rating: 5
      }
    ],
    examples: [
      {
        id: 'military1',
        title: 'WWII Service Portrait',
        beforeImage: '/showcase/before1.webp',
        afterImage: '/showcase/after1.webp',
      },
      {
        id: 'military2',
        title: 'Unit Group Photo',
        beforeImage: '/showcase/before2.webp',
        afterImage: '/showcase/after2.webp',
      }
    ],
    ctaSection: {
      title: 'Preserve Military Legacy',
      description: 'Honor service members and veterans by restoring their military photographs with dignity and respect'
    }
  },

  antique: {
    slug: 'antique',
    metadata: {
      title: 'Antique Photo Restoration - Preserve Historical Treasures',
      description: 'Restore antique photographs and historical documents with museum-quality results. Professional restoration for daguerreotypes, tintypes, and vintage prints.',
      keywords: ['antique photo restoration', 'historical photographs', 'daguerreotype restoration', 'tintype restoration', 'archival photo repair'],
    },
    hero: {
      title: 'Preserve Historical Photographic Treasures',
      subtitle: 'Restore antique photographs with museum-quality precision',
      description: 'Breathe new life into historical photographic treasures. From daguerreotypes and tintypes to vintage glass plates and albumen prints, our restoration technology can preserve these irreplaceable pieces of photographic history.',
    },
    features: [
      {
        icon: History,
        title: 'Museum Quality',
        description: 'Professional restoration suitable for museums, archives, and collectors',
        color: 'text-amber-600'
      },
      {
        icon: Shield,
        title: 'Archival Standards',
        description: 'Restoration that meets professional archival and conservation standards',
        color: 'text-blue-600'
      },
      {
        icon: Camera,
        title: 'Historical Accuracy',
        description: 'Preserve the authentic look and feel of historical photographic processes',
        color: 'text-green-600'
      }
    ],
    testimonials: [
      {
        quote: "Inherited a collection of 1800s daguerreotypes that were severely tarnished. The restoration revealed incredible detail while preserving their historical character.",
        author: "Dr. Patricia H.",
        rating: 5
      },
      {
        quote: "Local historical society needed glass plate negatives restored for a museum exhibit. The results exceeded our expectations - truly professional quality.",
        author: "Richard M., Museum Curator",
        rating: 5
      },
      {
        quote: "Found Civil War era photographs in my attic. The restoration brought out details I never imagined were there - absolutely stunning work.",
        author: "Elizabeth D.",
        rating: 5
      }
    ],
    examples: [
      {
        id: 'antique1',
        title: '1800s Daguerreotype',
        beforeImage: '/showcase/before1.webp',
        afterImage: '/showcase/after1.webp',
      },
      {
        id: 'antique2',
        title: 'Victorian Glass Plate',
        beforeImage: '/showcase/before2.webp',
        afterImage: '/showcase/after2.webp',
      }
    ],
    ctaSection: {
      title: 'Preserve Photographic History',
      description: 'Restore antique photographs and preserve irreplaceable pieces of photographic heritage'
    }
  }
};

export const getThemeConfig = (slug: string): ThemePageConfig | null => {
  return themeConfigs[slug] || null;
};

export const getAllThemeSlugs = (): string[] => {
  return Object.keys(themeConfigs);
};