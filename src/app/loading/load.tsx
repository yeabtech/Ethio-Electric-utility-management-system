'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function Loading() {
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowMessage(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={styles.container}>
      {!showMessage ? (
        <div style={styles.loaderContainer}>
          <Image
            src="/loader.gif"
            alt="Loading..."
            width={80}
            height={80}
            priority
            unoptimized={true}
            style={styles.loader}
          />
        </div>
      ) : (
        <p style={styles.message}>Low internet speed detected. Please check your Wi-Fi connection.</p>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    flexDirection: 'column' as const,
    backgroundColor: '#0b1c26',
  },
  loaderContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    animation: 'pulse 0.3s ease-in-out infinite, rotate 0.5s linear infinite',
  },
  loader: {
    objectFit: 'contain' as const,
    transform: 'scale(1)',
  },
  message: {
    fontSize: '18px',
    color: '#333',
    textAlign: 'center' as const,
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  '@keyframes pulse': {
    '0%': {
      transform: 'scale(0.95)',
    },
    '50%': {
      transform: 'scale(1.05)',
    },
    '100%': {
      transform: 'scale(0.95)',
    },
  },
  '@keyframes rotate': {
    '0%': {
      transform: 'rotate(0deg)',
    },
    '100%': {
      transform: 'rotate(360deg)',
    },
  },
};
