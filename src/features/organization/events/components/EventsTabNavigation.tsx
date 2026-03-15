"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { EventStatus } from "../types"

export type TabValue = EventStatus | "all"

interface EventsTabNavigationProps {
  currentTab: TabValue
  onTabChange: (tab: TabValue) => void
  isDesktop: boolean
}

export function EventsTabNavigation({ currentTab, onTabChange, isDesktop }: EventsTabNavigationProps) {
  if (isDesktop) {
    return (
      <Tabs value={currentTab} onValueChange={(v) => onTabChange(v as TabValue)}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>
    )
  }

  return (
    <Select value={currentTab} onValueChange={(v) => onTabChange(v as TabValue)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Filter by status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Events</SelectItem>
        <SelectItem value="ongoing">Ongoing</SelectItem>
        <SelectItem value="upcoming">Upcoming</SelectItem>
        <SelectItem value="completed">Completed</SelectItem>
        <SelectItem value="archived">Archived</SelectItem>
      </SelectContent>
    </Select>
  )
}