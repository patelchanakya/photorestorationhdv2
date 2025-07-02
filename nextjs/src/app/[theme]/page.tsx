import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getThemeConfig, getAllThemeSlugs } from '@/config/themes';
import ThemePage from '@/components/ThemePage';

interface ThemePageProps {
  params: Promise<{
    theme: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = getAllThemeSlugs();
  return slugs.map((slug) => ({
    theme: slug,
  }));
}

export async function generateMetadata({ params }: ThemePageProps): Promise<Metadata> {
  const { theme } = await params;
  const config = getThemeConfig(theme);
  
  if (!config) {
    return {
      title: 'Page Not Found',
      description: 'The requested page could not be found.',
    };
  }

  return {
    title: config.metadata.title,
    description: config.metadata.description,
    keywords: config.metadata.keywords.join(', '),
    openGraph: {
      title: config.metadata.title,
      description: config.metadata.description,
      type: 'website',
      images: config.metadata.ogImage ? [config.metadata.ogImage] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: config.metadata.title,
      description: config.metadata.description,
      images: config.metadata.ogImage ? [config.metadata.ogImage] : [],
    },
  };
}

export default async function ThemedPage({ params }: ThemePageProps) {
  const { theme } = await params;
  const config = getThemeConfig(theme);

  if (!config) {
    notFound();
  }

  return <ThemePage config={config} />;
}