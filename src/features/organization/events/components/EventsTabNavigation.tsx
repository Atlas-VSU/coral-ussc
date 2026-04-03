import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EventStatus } from "../types";

interface EventsTabNavigationProps {
  currentTab: EventStatus;
  setCurrentTab: (status: EventStatus) => void;
  loading: boolean;
  isDesktop: boolean;
}

export function EventsTabNavigation({
  currentTab,
  setCurrentTab,
  isDesktop,
}: EventsTabNavigationProps) {
  if (isDesktop) {
    return (
      <TabsList className="grid w-full gap-2 grid-cols-5">
        <TabsTrigger value="ongoing" className="relative hover:cursor-pointer">
          Ongoing
        </TabsTrigger>
        <TabsTrigger value="upcoming" className="hover:cursor-pointer">
          Upcoming
        </TabsTrigger>
        <TabsTrigger value="completed" className="hover:cursor-pointer">
          Completed
        </TabsTrigger>
        <TabsTrigger value="archived" className="hover:cursor-pointer">
          Archived
        </TabsTrigger>
        <TabsTrigger value="all" className="hover:cursor-pointer">
          All
        </TabsTrigger>
      </TabsList>
    );
  }

  // Mobile: horizontal scrollable chips
  return (
    <div className="-mx-5 px-5 overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 pb-1">
        {[
          { value: "ongoing", label: "Ongoing" },
          { value: "upcoming", label: "Upcoming" },
          { value: "completed", label: "Completed" },
          { value: "archived", label: "Archived" },
          { value: "all", label: "All" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setCurrentTab(tab.value as EventStatus)}
            className={`
              shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all
              ${
                currentTab === tab.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 active:scale-95"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}