"use client";

import { useState, useEffect } from "react";
import {
  getDashboardStats,
  getDashboardRecentMembers,
  getDashboardUpcomingEvents,
  getDashboardOngoingEvents,
  getDashboardEvents,
  getDashboardRecentPayments,
  getDashboardFeesCollected,
  getDashboardUnpaidFinesAmount,
  getDashboardClearanceRate,
} from "@/firebase/dashboard";
import { Event } from "../types";
import { Member } from "../../members/types";
import { DashboardPayment } from "../components/RecentPayments";
import { set } from "zod";
import { useTermPeriod } from "../../term/hooks/useTermPeriod";


export interface DashboardStats {
  totalStudents: number;
  totalEvents: number;
  totalAttendances: number;
  overallAttendanceRate: number;
  averageAttendance: number;
  peakAttendance: number;
  totalAbsences: number;
}

export function useDashboard() {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [ongoingEvents, setOngoingEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [recentMembers, setRecentMembers] = useState<Member[]>([]);
  const [recentPayments, setRecentPayments] = useState<DashboardPayment[]>([]);
  const [feesCollected, setFeesCollected] = useState(0);
  const [unpaidFinesAmount, setUnpaidFinesAmount] = useState(0);
  const [clearanceRate, setClearanceRate] = useState(0);

  const { selected } = useTermPeriod()

  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalEvents: 0,
    totalAttendances: 0,
    overallAttendanceRate: 0,
    averageAttendance: 0,
    peakAttendance: 0,
    totalAbsences: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel for efficiency
      const [
        dashboardStats,
        upcomingEventsData,
        ongoingEventsData,
        allEventsData,
        recentMembersData,
        recentPaymentsData,
        feesCollectedData,
        unpaidFinesAmountData,
        clearanceRateData,
      ] = await Promise.all([
        getDashboardStats(selected),
        getDashboardUpcomingEvents(5, selected!),
        getDashboardOngoingEvents(5, selected!),
        getDashboardEvents(5, selected),
        getDashboardRecentMembers(5),
        getDashboardRecentPayments(5, selected),
        getDashboardFeesCollected(selected),
        getDashboardUnpaidFinesAmount(selected),
        getDashboardClearanceRate(selected!),
      ]);

      // Update state with fetched data
      setStats(dashboardStats);
      setUpcomingEvents(upcomingEventsData);
      setOngoingEvents(ongoingEventsData);
      setAllEvents(allEventsData);
      setRecentMembers(recentMembersData);
      setRecentPayments(recentPaymentsData);
      setFeesCollected(feesCollectedData);
      setUnpaidFinesAmount(unpaidFinesAmountData);
      setClearanceRate(clearanceRateData);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch dashboard data")
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on initial load
  useEffect(() => {
    fetchDashboardData();
  }, [selected]);

  // Function to manually refresh dashboard data
  const refreshDashboard = () => {
    fetchDashboardData();
  };

  return {
    stats,
    selected,
    upcomingEvents,
    ongoingEvents,
    allEvents,
    recentMembers,
    isLoading,
    error,
    refreshDashboard,
    recentPayments,
    feesCollected,
    unpaidFinesAmount,
    clearanceRate,
  };
}