import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: {
    default: "Nomichi | Travel that finds you",
    template: "%s | Nomichi"
  },
  description: "Nomichi designs slow, offbeat, small-group journeys for people who want a trip to feel personal. Explore our curated trips and wander with us.",
  keywords: ["Nomichi", "slow travel", "small group travel", "offbeat journeys", "community-led travel", "experiential travel"],
  openGraph: {
    title: "Nomichi | Travel that finds you",
    description: "Slow, offbeat, small-group journeys for people who want a trip to feel personal. Find your next adventure.",
    url: "https://nomichiproject.vercel.app",
    siteName: "Nomichi",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nomichi | Travel that finds you",
    description: "Slow, offbeat, small-group journeys for people who want a trip to feel personal.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

