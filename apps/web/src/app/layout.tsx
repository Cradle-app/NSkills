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
  title: '[N]skills - Web3 Skills Composer',
  description: 'Compose N skills for your Web3 project visually. Define architecture, generate a skills repo, then let Claude Code scaffold the full project.',
  icons: {
    icon: '/favicon.ico',
  },
  metadataBase: new URL('https://www.nskills.xyz'),
  openGraph: {
    title: '[N]skills - Web3 Skills Composer',
    description: 'Compose N skills for your Web3 project visually. Define architecture, generate a skills repo, then let Claude Code scaffold the full project.',
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
