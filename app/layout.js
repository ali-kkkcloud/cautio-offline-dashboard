import "./globals.css";

export const metadata = {
  title: "Vehicles Offline > 48 Hours | Fleet Operations",
  description: "Fleet operations dashboard — vehicles offline for more than 48 hours",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bgmain text-slate-100 antialiased">{children}</body>
    </html>
  );
}
