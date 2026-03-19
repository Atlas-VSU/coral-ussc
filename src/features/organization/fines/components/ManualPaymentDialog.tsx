import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SelectTrigger, SelectValue, SelectContent, SelectItem, Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FineItem, StudentFines } from "../types";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useProofOfPaymentForm } from "../hooks/useProofOfPaymentForm";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PaymentType } from "@/constants/types";
import { PaymentFormData } from "@/lib/validators";
import { addOfflineFinesPayment } from "@/firebase/payment/create/paymentHistory";
import PaymentReceiptDialog, { ReceiptData, ReceiptItem } from "@/components/organization/PaymentReceiptDialog";
import { getProofOfPaymentById } from "@/firebase/payment/read/proofOfPayment";
import { string } from "zod";


interface ManualPaymentDialogProps { 
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fines: StudentFines;
    fineItems: FineItem[];
    onSuccess?: () => void;

}

export function ManualPaymentDialog({ open, onOpenChange, fines, fineItems, onSuccess }: ManualPaymentDialogProps) {
    
    const [manualPayMethod, setManualPayMethod] = useState<string>("cash");
    const [manualPayNotes, setManualPayNotes] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [receiptOpen, setReceiptOpen] = useState(false);
    const [receiptData, setReceiptData] = useState<ReceiptData>();
    
    const form = useProofOfPaymentForm(
        {
            defaultValues: {
                userName: fines.userName,
                studentId: fines.studentId,
                amount: fines.balance,
                paymentMethod: "cash",
            }
        }
    );

    const handleManualPayment = async (data: PaymentFormData) => {
        setIsSubmitting(true);
        try {
            const proofId = await addOfflineFinesPayment(fines, PaymentType.FINES, manualPayMethod as any, data.referenceNumber, data.senderNumber);
            
            const proofData = await getProofOfPaymentById(proofId!);
            setReceiptData({
                receiptId: proofData?.receiptCode!,
                studentName: proofData?.userName!,
                studentId: proofData?.studentId!,
                items: proofData?.metadata.items!.map((item) => {
                    return {
                        refId: item.refId,
                        name: item.title,
                        amount: item.amount,
                        type: item.paymentType as "fees" | "fines",
                        parentFineId: item.parentFineId,
                    };
                })!,
                total: proofData?.amount!,
                date: proofData?.submittedAt?.toDate().toLocaleString() || "",
                verifiedByName: proofData?.verifiedByName!,
                paymentMethod: proofData?.paymentMethod!,
            });
            setReceiptOpen(true);
            onSuccess?.();
            toast.success("A payment was logged successfully.");
        } catch (error) {
        toast.error("Failed to log payment. Please try again.");
        } finally {
        setIsSubmitting(false);
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
                <Form {...form}>
                    <form  onSubmit={form.handleSubmit(handleManualPayment)}>
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
                        <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                            <FormItem className="flex flex-col gap-1.5">
                            <FormLabel>Payment Method <span className="text-destructive">*</span></FormLabel>
                            <Select 
                                onValueChange={(value) => {
                                field.onChange(value); 
                                setManualPayMethod(value);
                                if (value === "gcash") {
                                    form.setValue("senderNumber", "");
                                    form.setValue("referenceNumber", "");
                                }
                                if (value === "bank_transfer") {
                                    form.setValue("senderNumber", "");
                                }
                                }} 
                                defaultValue={manualPayMethod}
                            >
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a method" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="gcash">GCash</SelectItem>
                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        {manualPayMethod !== "cash" && (
                            <FormField
                                control={form.control}
                                name="referenceNumber"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col gap-1.5">
                                    <FormLabel>Reference Number <span className="text-destructive">*</span></FormLabel>
                                    <FormControl>
                                        <Input 
                                        {...field} 
                                        placeholder={manualPayMethod === "gcash" ? "GCash reference no." : "Bank transaction ref."}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />
                        )}
                        {manualPayMethod === "gcash" && (
                               <FormField
                                control={form.control}
                                name="senderNumber"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col gap-1.5">
                                    <FormLabel>
                                        Sender Number <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                        {...field}
                                        placeholder="09123456789"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                                />
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
                        <Button type="submit" className="gap-1.5" disabled={isSubmitting}>
                            <PenLine className="size-3.5" /> {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                    { "Processing..."}
                                </>
                            ) : ("Mark as Paid")}
                        </Button>
                        </DialogFooter>
                        </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

             <PaymentReceiptDialog
                open={receiptOpen}
                onOpenChange={(v) => {
                    setReceiptOpen(v);
                    if (!v) {
                        onSuccess && onSuccess();
                        onOpenChange(false);
                    }
                }}
                data={receiptData!}
             />               
            </div>
        )
    }
