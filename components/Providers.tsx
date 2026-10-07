"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import { LanguageProvider } from "@/lib/i18n";
import { NarrationProvider } from "@/lib/narration";
import { ProgressProvider } from "@/lib/progress";
import { AuthDialog } from "./AuthDialog";
import { StatusToasts } from "./StatusToasts";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <NarrationProvider>
        <AuthProvider>
          <ProgressProvider>
            {children}
            <AuthDialog />
            <StatusToasts />
          </ProgressProvider>
        </AuthProvider>
      </NarrationProvider>
    </LanguageProvider>
  );
}
