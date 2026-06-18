import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nomichi — Travel that finds you",
  description:
    "Slow, offbeat, small-group journeys for people who want a trip to feel personal.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
