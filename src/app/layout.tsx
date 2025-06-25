//src/app/layout.tsx

import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from './context/ThemeContext';
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
        <html lang="en">
          <body>{children}
            <Toaster />
          </body>
        </html>
      </ThemeProvider>
    </ClerkProvider>
  );
}