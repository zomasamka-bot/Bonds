import { BONDS_APP_CONFIG } from "@/lib/bonds-config";
import { Shield } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="border-t border-border bg-card/30 mt-12">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm text-foreground">
                {BONDS_APP_CONFIG.identity.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {BONDS_APP_CONFIG.identity.domain}
              </div>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
            {BONDS_APP_CONFIG.identity.description}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Version {BONDS_APP_CONFIG.identity.version}</span>
            <span>•</span>
            <span>{BONDS_APP_CONFIG.release.tag}</span>
            <span>•</span>
            <span>Pi Network</span>
          </div>
          
          <p className="text-xs text-muted-foreground">
            No financial execution • No asset custody • Signature authentication only
          </p>
        </div>
      </div>
    </footer>
  );
}
