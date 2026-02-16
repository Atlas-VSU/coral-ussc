import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon, SearchIcon } from "lucide-react";
import { AddEventDialog } from "./AddEventDialog";

interface EventsHeaderProps {
  onSearch: (query: string) => void;
  onEventAdded?: () => void;
}

export function EventsHeader({ onSearch, onEventAdded }: EventsHeaderProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const handleEventAdded = () => {
    setIsAddDialogOpen(false);
    onEventAdded?.();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-6">
      <div className="flex flex-col space-y-6 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        {/* Title Section */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Events
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Manage your organization&apos;s events and track attendance
          </p>
        </div>

        {/* Actions Section */}
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0 lg:flex-shrink-0">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search events..."
              className="w-full pl-10 pr-4 py-2 sm:w-[280px] h-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-primary/20 focus:border-primary"
              value={searchValue}
              onChange={handleSearchChange}
            />
          </form>

          {/* Add Event Button */}
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="h-10 px-6 bg-primary hover:bg-primary/90 text-white font-medium shadow-sm transition-colors"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>
      </div>

      <AddEventDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onEventAdded={handleEventAdded}
      />
    </div>
  );
}
