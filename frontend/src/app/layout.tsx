import "@/app/globals.css";
import { AppSidebar } from "@/shared/components/layout/AppSidebar";
import { TopHeader } from "@/shared/components/layout/TopHeader";

export const metadata = {
  title: "GreenSM HITL Lab",
  description: "End-to-End Human-in-the-Loop Annotation Lab",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex h-screen w-screen overflow-hidden bg-[#0a0a0a]">
        <AppSidebar />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <TopHeader />
          <main className="flex-1 overflow-y-auto bg-[#0a0a0a] p-6 text-zinc-100">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
