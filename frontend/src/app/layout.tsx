import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BookWorm - Your Personal Book Recommendation Service",
    template: "%s | BookWorm",
  },
  description: "Discover personalized book recommendations, track your reading journey, and connect with a community of passionate readers. BookWorm helps you find your next favorite book.",
  keywords: [
    "BookWorm",
    "book recommendations",
    "reading tracker",
    "book reviews",
    "reading community",
    "book discovery",
    "personalized recommendations",
    "reading goals",
    "book lovers",
    "literature",
    "authors",
    "book clubs",
  ],
  authors: [{ name: "BookWorm Team" }],
  creator: "BookWorm",
  publisher: "BookWorm",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/logo.svg",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bookworm.app",
    siteName: "BookWorm",
    title: "BookWorm - Your Personal Book Recommendation Service",
    description: "Discover personalized book recommendations, track your reading journey, and connect with a community of passionate readers.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BookWorm - Book Recommendation Service",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BookWorm - Your Personal Book Recommendation Service",
    description: "Discover personalized book recommendations, track your reading journey, and connect with a community of passionate readers.",
    images: ["/og-image.png"],
    creator: "@bookworm",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  applicationName: "BookWorm",
  appleWebApp: {
    capable: true,
    title: "BookWorm",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
