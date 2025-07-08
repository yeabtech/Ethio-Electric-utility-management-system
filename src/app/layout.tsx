//src/app/layout.tsx

import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <ThemeProvider>
        <LanguageProvider>
          <html lang="en">
            <body>{children}
              <Toaster />
            </body>
          </html>
        </LanguageProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}