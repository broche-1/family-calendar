import type { Metadata } from "next";

import "./styles.css";

export const metadata: Metadata = {
  title: "Family Weekend Planner",
  description: "Coordinate family weekend availability.",
  robots: {
    index: false,
    follow: false
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
