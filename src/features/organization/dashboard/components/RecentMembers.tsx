/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Member, Program } from "../../members/types";
import { useEffect, useState } from "react";
import { getPrograms } from "@/firebase";
import { UserPlus } from "lucide-react";

interface RecentMembersProps {
  isLoading?: boolean;
  recentMembers: Member[];
}

export function RecentMembers({
  isLoading = false,
  recentMembers,
}: RecentMembersProps) {
  const [programs, setPrograms] = useState<Program[]>([]);

  useEffect(() => {
    const fetchPrograms = async () => {
      const programsData = await getPrograms();
      setPrograms(programsData as Program[]);
    };
    fetchPrograms();
  }, []);

  function getProgramName(programId: string) {
    const program = programs.find((p) => p.id === programId);
    return program ? program.name : "Unknown Program";
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }

  const MemberSkeletons = () => (
    <>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="space-y-1.5 min-w-0">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-5 w-16 shrink-0" />
        </div>
      ))}
    </>
  );

  return (
    <Card className="border-border bg-card gap-0">
      <CardHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
            <UserPlus className="size-4 text-primary" />
            Recently Added Members
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs h-7"
          >
            <Link href="/org-members">View All</Link>
          </Button>
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Newest registrations
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="flex flex-col gap-2">
          {isLoading ? (
            <MemberSkeletons />
          ) : recentMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <UserPlus className="h-8 w-8 mb-3 opacity-40" />
              <p className="text-sm font-medium">No members found</p>
              <p className="text-xs mt-1">Add your first member to get started</p>
            </div>
          ) : (
            recentMembers.map((member) => (
              <div
                key={member.studentId}
                className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                      {getInitials(member.firstName + " " + member.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {getProgramName(member.programId)}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right flex flex-col items-end gap-1">
                  <p className="text-xs text-muted-foreground">
                    {member.createdAt
                      ? `Joined ${
                          typeof member.createdAt === "object" &&
                          member.createdAt !== null &&
                          typeof (member.createdAt as any).toDate === "function"
                            ? (member.createdAt as any).toDate().toLocaleDateString()
                            : "Unknown"
                        }`
                      : "Unknown"}
                  </p>
                  <Badge
                    variant="outline"
                    className="text-xs font-semibold px-2 py-0.5"
                  >
                    {member.studentId}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}