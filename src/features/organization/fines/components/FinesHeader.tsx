import { Button } from "@/components/ui/button";
import { PageHeader } from "@/features/organization/fines/components/PageHeader";
import { Eye, TicketPlus, UserPlus } from "lucide-react";

interface FinesHeaderProps {
  onAddFineType: () => void;
  onBulkGenerate: () => void;
}

export function FinesHeader({
  onAddFineType,
  onBulkGenerate,
}: FinesHeaderProps) {

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <PageHeader
        title="Fines Management"
        context="2nd Semester · A.Y. 2025–2026"
        description="Review and manage student fines"
      />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 text-[#333333]">
        <div className="flex gap-2">

          {/* NOTE: THIS IS THE BUTTON TO TRIGGER BULK GENERATION OF FINES CONTAINER FOR ALL STUDENTS OR MEMBERS THAT ARE ALREADY ADDED IN THE DATABASE */}
          {/* USING THIS MEANS A BRUTEFORCE SINCE A FINES CONTAINER SHOULD BE MADE TOGETHER WITH THE CLEARANCE AS SOON AS A STUDENT WAS ADDED TO THE SYSTEM */}
          {/* <Button size="sm" onClick={onBulkGenerate}>
            Seed Fines to All Users
          </Button> */}
          
          <Button variant="outline" size="lg" onClick={onAddFineType}>
            <Eye className="h-4 w-4 mr-2" />
            View Fine Types
          </Button>
        </div>
      </div>
    </div>
  );
}
