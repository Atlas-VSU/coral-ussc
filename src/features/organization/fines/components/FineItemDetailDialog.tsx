import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FineItem } from "../types";
import { ShieldCheckIcon, MessageSquareIcon, XIcon } from "lucide-react";
import { appealStatusConfig } from "../config";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";


function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

interface FineItemDetailDialogProps { 
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fineItem: FineItem;
}

export function FineItemDetailDialog({ open, onOpenChange, fineItem }: FineItemDetailDialogProps) {


    return (
        <div>
        <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fine Item Details — #{fineItem.itemNumber}</DialogTitle>
            <DialogDescription>Complete details of this fine item.</DialogDescription>
          </DialogHeader>
          {fineItem && (
            <div className="flex flex-col gap-4">
              <Separator />

              {/* Core fine details */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <DetailRow label="Item Number"    value={`#${fineItem.itemNumber}`} />
                {/* <DetailRow label="Fine Type Code" value={fineItem.fineTypeCode} /> */}
                <DetailRow label="Fine Type Name" value={
                  <span className="flex items-center gap-2">
                    {fineItem.fineTypeName}
                    {fineItem.isWaived && (
                      <Badge variant="outline" className="py-0 text-xs">Waived</Badge>
                    )}
                  </span>
                } />
                {fineItem.eventName && <DetailRow label="Event Name" value={fineItem.eventName} />}
                {fineItem.eventDate && <DetailRow label="Event Date" value={fineItem.eventDate.toDate().toLocaleDateString()} />}
                <DetailRow label="Amount"         value={`₱${fineItem.amount.toLocaleString()}`} />
                <DetailRow label="Reason"         value={fineItem.reason} />
                {/* {liveSelectedItem.timeViolation && (
                  <DetailRow label="Time Violation" value={liveSelectedItem.timeViolation} />
                )} */}
                <DetailRow label="Issued By" value={fineItem.issuedBy} />
                <DetailRow label="Issued At" value={fineItem.issuedAt.toDate().toLocaleDateString()} />
              </div>

              {/* Waiver details */}
              {fineItem.isWaived && (fineItem.waivedBy || fineItem.waivedAt || fineItem.waivedReason) && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheckIcon className="size-3.5 shrink-0 text-muted-foreground" />
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Waiver Details
                      </p>
                    </div>
                    <div className="rounded-md border border-border bg-muted/40 px-4 py-3 flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        {fineItem.waivedBy && <DetailRow label="Waived By" value={fineItem.waivedBy} />}
                        {fineItem.waivedAt && <DetailRow label="Waived At" value={fineItem.waivedAt.toDate().toLocaleDateString()} />}
                      </div>
                      {fineItem.waivedReason && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">Reason</span>
                          <p className="text-sm text-foreground leading-relaxed">{fineItem.waivedReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Appeal details */}
              {fineItem.appealNotes && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <MessageSquareIcon className="size-3.5 shrink-0 text-muted-foreground" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Appeal Details
                        </p>
                      </div>
                      <Badge variant={appealStatusConfig[fineItem.appealStatus!].variant} className="text-xs">
                        {appealStatusConfig[fineItem.appealStatus!].label}
                      </Badge>
                    </div>
                    <div className="rounded-md border border-border bg-muted/40 px-4 py-3 flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Student&apos;s Appeal Notes</span>
                        <blockquote className="mt-1 border-l-2 border-muted-foreground/30 pl-3">
                          <p className="text-sm text-foreground leading-relaxed">{fineItem.appealNotes}</p>
                        </blockquote>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <DetailRow label="Appealed At" value={fineItem.appealedAt?.toDate().toLocaleDateString()} />
                        {fineItem.appealResolvedBy && <DetailRow label="Resolved By" value={fineItem.appealResolvedBy} />}
                        {fineItem.appealResolvedAt && <DetailRow label="Resolved At" value={fineItem.appealResolvedAt.toDate().toLocaleDateString()} />}
                      </div>
                      {/* {fineItem.appealStatus! === "rejected" && fineItem.appealRejectionReason && (
                        <div className="flex items-start gap-2 rounded-sm border border-destructive/20 bg-destructive/10 px-3 py-2">
                          <XIcon className="size-3.5 mt-0.5 shrink-0 text-destructive" />
                          <p className="text-xs text-destructive leading-relaxed">
                            {fineItem.appealRejectionReason}
                          </p>
                        </div>
                      )} */}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
        </div>
    );
}