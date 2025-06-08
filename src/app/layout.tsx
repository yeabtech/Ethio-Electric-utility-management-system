//src/app/layout.tsx

import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from './context/ThemeContext';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <ThemeProvider>
        <html lang="en">
          <body>{children}</body>
        </html>
      </ThemeProvider>
    </ClerkProvider>
  );
}