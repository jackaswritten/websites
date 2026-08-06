import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { useRef } from "react";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const sigRef = useRef<HTMLImageElement | null>(null);

  const handlePressStart = () => {
    const el = sigRef.current;
    if (!el) return;
    el.style.transition = "transform 150ms ease";
    el.style.transform = "scale(1.2)";
  };

  const handlePressEnd = () => {
    const el = sigRef.current;
    if (!el) return;
    el.style.transition = "transform 120ms ease";
    el.style.transform = "scale(0.9)";
    setTimeout(() => {
      if (!sigRef.current) return;
      sigRef.current.style.transition = "transform 180ms ease";
      sigRef.current.style.transform = "scale(1)";
    }, 120);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <div className="relative">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/admin" element={<Admin />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <a
            href={(import.meta as any).env?.VITE_SIGNATURE_LINK || "https://jcreations.dev"}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3"
            aria-label="Visit website"
          >
            <img
              ref={sigRef}
              src="/signature.svg"
              alt="signature"
              className="w-16 h-auto opacity-70 transition-all duration-200 ease-out hover:opacity-90 hover:scale-105 active:scale-95 select-none transform"
              loading="lazy"
              decoding="async"
              onTouchStart={handlePressStart}
              onTouchEnd={handlePressEnd}
              onTouchCancel={handlePressEnd}
              onMouseDown={handlePressStart}
              onMouseUp={handlePressEnd}
              onMouseLeave={handlePressEnd}
            />
          </a>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
