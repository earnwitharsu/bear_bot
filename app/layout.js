'use client'

import localFont from "next/font/local";
import "./globals.css";
import Script from 'next/script';
import { Toaster } from 'react-hot-toast'
import { TonConnectUIProvider } from "@tonconnect/ui-react";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TonConnectUIProvider manifestUrl="https://violet-traditional-rabbit-103.mypinata.cloud/ipfs/QmQJJAdZ2qSwdepvb5evJq7soEBueFenHLX3PoM6tiBffm">
          <div>
            {children}
            <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#2B0537',
              color: '#fff',
              border: '1px solid #FF0307',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
          </div>
        </TonConnectUIProvider>
      </body>
    </html>
  );
}