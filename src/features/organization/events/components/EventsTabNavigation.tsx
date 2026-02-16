import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Event status type
export type EventStatus =
  | "ongoing"
  | "upcoming"
  | "completed"
  | "archived"
  | "all";

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

  return (
    <div className="w-full mb-4">
      <Select
        value={currentTab}
        onValueChange={(value: EventStatus) => setCurrentTab(value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ongoing">Ongoing</SelectItem>
          <SelectItem value="upcoming">Upcoming</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
          <SelectItem value="all">All Events</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
