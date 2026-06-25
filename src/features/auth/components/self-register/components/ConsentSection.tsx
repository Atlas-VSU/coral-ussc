import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface ConsentSectionProps {
    agreed: boolean;
    setAgreed: (agreed: boolean) => void;
}

export function ConsentSection({ agreed, setAgreed }: ConsentSectionProps) {
    return (
        <div className="bg-[#8BC34A]/5 p-4 rounded-md border !border-[#2E7D32]/30">
            <div className="flex items-start gap-3">
                <Checkbox
                    id="terms"
                    checked={agreed}
                    onCheckedChange={(checked: boolean) =>
                        setAgreed(checked === true)
                    }
                    className="mt-0.5 !bg-white !border-[#2E7D32]/40 data-[state=checked]:!bg-white data-[state=checked]:!text-[#1B5E20] data-[state=checked]:!border-[#1B5E20]"
                />
                <div>
                    <Label
                        htmlFor="terms"
                        className="text-xs text-[#2E7D32]/80 leading-relaxed"
                    >
                        I consent to the collection of my information for the purpose of this registration and confirm that the information provided is accurate.
                    </Label>
                </div>
            </div>
        </div>
    )
}