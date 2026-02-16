/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Member, Program } from "../../members/types";
import { useEffect, useState } from "react";
import { getPrograms } from "@/firebase";
import { UsersRound } from "lucide-react";

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

  // Member skeleton loader
  const MemberSkeletons = () => (
    <>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl border-2 border-border/30 bg-gradient-to-r from-background/80 to-muted/20">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-[180px]" />
            <Skeleton className="h-3 w-[120px]" />
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-3 w-[80px]" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
        </div>
      ))}
    </>
  );

  return (
    <Card className="shadow-lg transition-all duration-300 border-border/50 bg-gradient-to-br from-background via-background to-muted/10 backdrop-blur-sm animate-fade-in-up animation-delay-800">
      <CardHeader className="pb-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-50" />
        <CardTitle className="flex justify-between items-center text-xl font-bold relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-sm">
              <UsersRound className="h-5 w-5" />
            </div>
            <span className="leading-tight">Recently Added Members</span>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:shadow-md hover:scale-105 font-medium border-primary/20 hover:border-primary"
          >
            <Link href="/org-members" className="flex items-center gap-2">
              View All
              <UsersRound className="h-4 w-4" />
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 relative z-10">
        <div className="space-y-3">
          {isLoading ? (
            <MemberSkeletons />
          ) : recentMembers.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground animate-fade-in-up animation-delay-1000">
              <div className="p-4 rounded-2xl bg-muted/30 w-fit mx-auto mb-4">
                <UsersRound className="h-8 w-8 opacity-50" />
              </div>
              <p className="text-lg font-semibold mb-2">No members found</p>
              <p className="text-sm">Add your first member to get started</p>
            </div>
          ) : (
            recentMembers.map((member, index) => (
              <div
                key={member.studentId}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 border-border/30 hover:border-primary/40 hover:bg-gradient-to-r hover:from-background hover:to-primary/5 transition-all duration-300 group hover:shadow-md hover:shadow-primary/10 bg-gradient-to-r from-background/80 to-muted/20 backdrop-blur-sm animate-fade-in-up animation-delay-${1000 + index * 100}`}
              >
                <Avatar className="h-12 w-12 ring-2 ring-muted group-hover:ring-primary/30 transition-all duration-300 group-hover:scale-110">
                  <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/20 text-primary font-bold text-base">
                    {getInitials(member.firstName + " " + member.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                    {member.firstName + " " + member.lastName}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="p-1.5 rounded-md bg-muted/50 text-muted-foreground">
                      <UsersRound className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-sm text-muted-foreground truncate font-medium">
                      {getProgramName(member.programId)}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="text-xs text-muted-foreground font-medium">
                    {member.createdAt
                      ? `Joined ${typeof member.createdAt === "object" &&
                          member.createdAt !== null &&
                          typeof (member.createdAt as any).toDate === "function"
                            ? (member.createdAt as any)
                                .toDate()
                                .toLocaleDateString()
                            : "Unknown"}`
                      : "Unknown"}
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs font-semibold px-2 py-0.5 bg-muted/50 hover:bg-muted transition-colors"
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
