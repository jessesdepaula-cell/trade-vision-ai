"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * AutoRefresh:
 * 1. Atualiza os dados da página (router.refresh) a cada 30s
 * 2. Dispara um scan completo da watchlist (POST /api/scan/run) a cada 15 minutos
 *    enquanto o usuário está com a aba aberta
 */
export function AutoRefresh({ intervalMs = 30000 }: { intervalMs?: number }) {
  const router = useRouter();
  const lastScanRef = useRef<number>(0);

  useEffect(() => {
    // Refresh de dados da página
    const refreshId = setInterval(() => router.refresh(), intervalMs);

    // Scan automático a cada 15 minutos
    const SCAN_INTERVAL = 15 * 60 * 1000; // 15 min

    async function triggerScan() {
      try {
        const res = await fetch("/api/scan/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (res.ok) {
          lastScanRef.current = Date.now();
          // Atualiza os dados após o scan
          router.refresh();
        }
      } catch {
        // Silencia erros de rede
      }
    }

    // Dispara o primeiro scan na montagem do componente
    // (apenas se já passou mais de 15 min desde o último scan registrado)
    const now = Date.now();
    if (now - lastScanRef.current > SCAN_INTERVAL) {
      triggerScan();
    }

    // Scan recorrente a cada 15 min
    const scanId = setInterval(triggerScan, SCAN_INTERVAL);

    return () => {
      clearInterval(refreshId);
      clearInterval(scanId);
    };
  }, [router, intervalMs]);

  return null;
}
