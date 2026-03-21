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
        getDashboardStats(),
        getDashboardUpcomingEvents(5),
        getDashboardOngoingEvents(5),
        getDashboardEvents(5),
        getDashboardRecentMembers(5),
        getDashboardRecentPayments(5),
        getDashboardFeesCollected(),
        getDashboardUnpaidFinesAmount(),
        getDashboardClearanceRate(),
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
  }, []);

  // Function to manually refresh dashboard data
  const refreshDashboard = () => {
    fetchDashboardData();
  };

  return {
    stats,
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