import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@/styles/globals.css';

// Load Inter font with optimal subset and display settings
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

export const metadata: Metadata = {
  title: 'Cradle - Web3 Foundation Builder',
  description: 'Build your Web3 project foundation visually. Define architecture, generate clean structured code, then fine-tune with AI.',
  icons: {
    icon: '/favicon.ico',
  },
  metadataBase: new URL('https://cradle.dev'),
  openGraph: {
    title: 'Cradle - Web3 Foundation Builder',
    description: 'Build your Web3 project foundation visually. Define architecture, generate clean structured code, then fine-tune with AI.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
