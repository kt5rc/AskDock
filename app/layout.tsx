import './globals.css';
import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: 'AskDock',
  description: 'Newbie Q&A Memo'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.className} min-h-screen bg-app text-foreground`}>
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-12 pt-6 sm:px-6">
          <header className="mb-6 flex items-center justify-between">
            <a href="/" className="text-lg font-semibold tracking-tight">
              AskDock
            </a>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Question Cards</div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
