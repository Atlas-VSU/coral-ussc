import { Button } from "@/components/ui/button";
import { QrCodeIcon, UserIcon, Computer } from "lucide-react";

export function AlternativeCheckInMethods() {
  return (
    <div className="bg-muted/30 px-4 py-5 sm:px-6">
      {/* Large desktop layout - full row */}
      <div className="hidden lg:flex lg:justify-between lg:items-center">
        <div className="text-sm font-medium text-muted-foreground">
          Alternative check-in methods
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="h-9" disabled>
            <Computer className="h-4 w-4 mr-2" />
            Kiosk Mode
            <span className="text-xs ml-1 text-muted-foreground">(Soon)</span>
          </Button>
          <Button variant="outline" size="sm" className="h-9" disabled>
            <QrCodeIcon className="h-4 w-4 mr-2" />
            Scan QR
            <span className="text-xs ml-1 text-muted-foreground">(Soon)</span>
          </Button>
          <Button variant="outline" size="sm" className="h-9" disabled>
            <UserIcon className="h-4 w-4 mr-2" />
            Self Check-in
            <span className="text-xs ml-1 text-muted-foreground">(Soon)</span>
          </Button>
        </div>
      </div>

      {/* Tablet layout - stacked with responsive grid */}
      <div className="hidden sm:block lg:hidden space-y-3">
        <div className="text-sm font-medium text-muted-foreground text-center">
          Alternative check-in methods
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Button variant="outline" size="sm" className="h-10 w-full" disabled>
            <Computer className="h-4 w-4 mr-2" />
            Kiosk Mode
            <span className="text-xs ml-1 text-muted-foreground">(Soon)</span>
          </Button>
          <Button variant="outline" size="sm" className="h-10 w-full" disabled>
            <QrCodeIcon className="h-4 w-4 mr-2" />
            Scan QR
            <span className="text-xs ml-1 text-muted-foreground">(Soon)</span>
          </Button>
          <Button variant="outline" size="sm" className="h-10 w-full" disabled>
            <UserIcon className="h-4 w-4 mr-2" />
            Self Check-in
            <span className="text-xs ml-1 text-muted-foreground">(Soon)</span>
          </Button>
        </div>
      </div>

      {/* Mobile layout - 2x2 grid */}
      <div className="sm:hidden space-y-3">
        <div className="text-sm font-medium text-muted-foreground text-center">
          Alternative check-in methods
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="h-10 w-full" disabled>
            <QrCodeIcon className="h-4 w-4 mr-1" />
            <span className="text-xs">Scan QR</span>
          </Button>
          <Button variant="outline" size="sm" className="h-10 w-full" disabled>
            <UserIcon className="h-4 w-4 mr-1" />
            <span className="text-xs">Self Check-in</span>
          </Button>
          <Button variant="outline" size="sm" className="h-10 w-full col-span-2" disabled>
            <Computer className="h-4 w-4 mr-1" />
            <span className="text-xs">Kiosk Mode</span>
          </Button>
        </div>
        <div className="text-xs text-center text-muted-foreground">
          (Coming soon)
        </div>
      </div>
    </div>
  );
}
