import { FloatReveal } from "@/components/float-reveal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { ThemeProvider, useTheme, themeInitScript } from "@/lib/theme";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold gradient-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Sahifa topilmadi</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Siz izlagan sahifa mavjud emas yoki ko'chirilgan.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
          >
            Bosh sahifaga
          </a>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: import("@tanstack/react-router").ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Sahifa yuklanmadi
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Kutilmagan xatolik yuz berdi. Sahifani yangilang yoki bosh sahifaga qayting.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
          >
            Qayta urinish
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/10"
          >
            Bosh sahifa
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0b0d1a" },
      { name: "author", content: "Mirzaxon Ravshanov" },
      { property: "og:site_name", content: "StartEdu" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "StartEdu — Matematikani professional darajada o'rganing" },
      { property: "og:title", content: "StartEdu — Matematikani professional darajada o'rganing" },
      { name: "twitter:title", content: "StartEdu — Matematikani professional darajada o'rganing" },
      { name: "description", content: "Milliy sertifikat, DTM, attestatsiya va matematika testlari uchun O'zbekistondagi zamonaviy platforma. To'liq testlar, AI yordamchi va analitika." },
      { property: "og:description", content: "Milliy sertifikat, DTM, attestatsiya va matematika testlari uchun O'zbekistondagi zamonaviy platforma. To'liq testlar, AI yordamchi va analitika." },
      { name: "twitter:description", content: "Milliy sertifikat, DTM, attestatsiya va matematika testlari uchun O'zbekistondagi zamonaviy platforma. To'liq testlar, AI yordamchi va analitika." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/827ddb62-0573-4800-8b4c-2d546855638f/id-preview-d6f97596--8bbd1194-3cdb-4e04-bf7e-2812574940b0.lovable.app-1785127492662.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/827ddb62-0573-4800-8b4c-2d546855638f/id-preview-d6f97596--8bbd1194-3cdb-4e04-bf7e-2812574940b0.lovable.app-1785127492662.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppShell>
          <Outlet />
        </AppShell>
        <AppToaster />
        <FloatReveal />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AppToaster() {
  const { theme } = useTheme();
  return <Toaster theme={theme} position="top-right" richColors closeButton />;
}

