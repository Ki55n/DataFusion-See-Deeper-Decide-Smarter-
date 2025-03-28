import type { Metadata } from "next";
import Aside from "@/components/Aside";
import React from "react";
import Providers from "@/app/providers";
import { AuthContextProvider } from "../context/AuthContext";

export const metadata: Metadata = {
  title: "Datatukey",
  description: "See Deeper Decide Smarter",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body className="dark text-foreground bg-gray-900">
        <Providers>
          <AuthContextProvider>
            <main className="flex h-screen">
              {/* Fixed Sidebar */}
              <Aside />

              {/* Main Content */}
              <div className="flex-grow overflow-y-auto h-screen">
                {/* Header remains at the top of the main content */}
                {/* <Header user={user} /> */}

                {/* Children content area */}
                <div className="flex-grow">{children}</div>
              </div>

              {/* Chatbot fixed button */}
            </main>
          </AuthContextProvider>
        </Providers>
      </body>
    </html>
  );
}
