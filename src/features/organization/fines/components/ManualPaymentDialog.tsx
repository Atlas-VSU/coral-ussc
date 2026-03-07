import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SelectTrigger, SelectValue, SelectContent, SelectItem, Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FineItem, StudentFines } from "../types";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { addOfflinePayment } from "@/firebase/payment/create/paymentHistory";
import { toast } from "sonner";


interface ManualPaymentDialogProps { 
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fines: StudentFines;
    fineItems: FineItem[];
    onSuccess?: () => void;

}

export function ManualPaymentDialog({ open, onOpenChange, fines, fineItems, onSuccess }: ManualPaymentDialogProps) {
    
    const [manualPayMethod, setManualPayMethod] = useState<string>("cash");
    const [manualPayRef, setManualPayRef] = useState<string>("");
    const [manualPayDate, setManualPayDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [manualPayNotes, setManualPayNotes] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleManualPayment = async () => {
        setIsSubmitting(true);
        try {
            await addOfflinePayment(fines.balance, "fines", fines.id!, manualPayMethod as any);
            onSuccess && onSuccess();
        toast.success("A payment was logged successfully.");
        } catch (error) {
        toast.error("Failed to log payment. Please try again.");
        } finally {
        setIsSubmitting(false);
            onOpenChange(false);
        }
    };
    
        return (
            <div>
                <Dialog open={open} onOpenChange={onOpenChange }>
                <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Log Manual Payment</DialogTitle>
                    <DialogDescription>
                    Record a cash or direct payment for{" "}
                    <span className="font-medium text-foreground">{fines.userName}</span>.
                    This will immediately mark all outstanding fines as settled.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    {fines && (
                    <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
                        <p className="text-xs text-muted-foreground">Amount to settle</p>
                        <p className="text-lg font-bold text-foreground mt-0.5">
                        ₱{fines.balance.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                        {fineItems.filter(i => !i.isWaived).length} fine item(s)
                        </p>
                    </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                    <Label htmlFor="manualPayMethod">Payment Method <span className="text-destructive">*</span></Label>
                    <Select value={manualPayMethod} onValueChange={setManualPayMethod}>
                        <SelectTrigger id="manualPayMethod">
                        <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="gcash">GCash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                    {manualPayMethod !== "cash" && (
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="manualPayRef">Reference Number</Label>
                        <Input
                        id="manualPayRef"
                        placeholder={manualPayMethod === "gcash" ? "GCash reference no." : "Bank transaction ref."}
                        value={manualPayRef}
                        onChange={e => setManualPayRef(e.target.value)}
                        />
                    </div>
                    )}
                    
                    {/* I think this input is not necessary na since we can just use the "now date" once successful ang payment log */}
                    {/* <div className="flex flex-col gap-1.5">
                    <Label htmlFor="manualPayDate">Date of Payment <span className="text-destructive">*</span></Label>
                    <Input
                        id="manualPayDate"
                        type="date"
                        value={manualPayDate}
                        onChange={e => setManualPayDate(e.target.value)}
                    />
                    </div> */}
                    <div className="flex flex-col gap-1.5">
                    <Label htmlFor="manualPayNotes">Notes <span className="text-xs text-muted-foreground">(optional)</span></Label>
                    <Textarea
                        id="manualPayNotes"
                        rows={2}
                        placeholder="Any additional notes about this payment…"
                        value={manualPayNotes}
                        onChange={e => setManualPayNotes(e.target.value)}
                        className="resize-none text-xs"
                    />
                    </div>
                    <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => { onOpenChange(false) }}>Cancel</Button>
                    <Button type="button" className="gap-1.5" onClick={handleManualPayment} disabled={isSubmitting}>
                        <PenLine className="size-3.5" /> Mark as Paid
                    </Button>
                    </DialogFooter>
                </div>
                </DialogContent>
            </Dialog>
            </div>
        )
    }
