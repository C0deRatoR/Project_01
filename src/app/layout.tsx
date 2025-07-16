import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeuralFlow - Brain Signal Monitoring",
  description: "Advanced brain signal monitoring dashboard with real-time EEG analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      </head>
      <body
        className="antialiased h-full min-h-screen bg-white dark:bg-slate-950 overflow-x-hidden font-sans"
      >
        <div className="min-h-screen w-full max-w-full">
          {children}
        </div>
      </body>
    </html>
  );
}
