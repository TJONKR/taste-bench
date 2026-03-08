import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import NavBar from "@/components/NavBar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "The Taste Bench — Deep Research Taste Evaluation",
  description: "Submit your public presence and get a deep research audit of your taste. AI-powered scoring across 6 dimensions with full analysis.",
  openGraph: {
    title: "The Taste Bench",
    description: "How good is your taste, really? Deep research taste evaluation.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen font-sans antialiased bg-canvas text-ink">
        <AuthProvider>
          <NavBar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
