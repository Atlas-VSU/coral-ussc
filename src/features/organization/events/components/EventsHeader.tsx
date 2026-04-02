import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { AddEventDialog } from "./AddEventDialog";
import { useEventFineTypes } from "../hooks/useEventFineTypes";

interface EventsHeaderProps {
  onSearch: (query: string) => void;
  onEventAdded?: () => void;
}

export function EventsHeader({ onSearch, onEventAdded }: EventsHeaderProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { fineTypes, fetchFineTypes } = useEventFineTypes();

  const handleAddEventClick = async () => {
    setIsAddDialogOpen(true);
    if (fineTypes.length === 0) await fetchFineTypes();
  };

  const handleEventAdded = () => {
    setIsAddDialogOpen(false);
    onEventAdded?.();
  };

  return (
    <div className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/20 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700/50 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-lg shadow-green-100/50 dark:shadow-gray-900/20 px-4 sm:px-6 py-4 sm:py-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Title Section */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <PlusIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-nunito text-xl font-bold text-gray-900 dark:text-gray-100">
              Events Management
            </h1>
            <p className="font-nunito-sans text-sm text-gray-600 dark:text-gray-400">
              Manage your organization's events and track attendance
            </p>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleAddEventClick}
          className="bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 self-start lg:self-auto"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      <AddEventDialog
        open={isAddDialogOpen}
        fineTypes={fineTypes}
        onOpenChange={setIsAddDialogOpen}
        onEventAdded={handleEventAdded}
      />
    </div>
  );
}