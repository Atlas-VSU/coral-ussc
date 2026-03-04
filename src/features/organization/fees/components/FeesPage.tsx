"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUsers } from "@/firebase/users";
import { Member } from "@/features/organization/members/types";
import { FeeGenerationDialog } from "./AddFeeDialog";

export function FeesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [students, setStudents] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const users = await getUsers();
        // Transform MemberData[] to Member[]
        const studentList = users.map(u => ({
          ...u.member,
          id: u.id
        })) as Member[];
        setStudents(studentList);
      } catch (error) {
        console.error("Failed to fetch students:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Student Fees</h2>
          <p className="text-muted-foreground">
            Manage and generate fees for all students in your organization.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={() => setIsDialogOpen(true)} disabled={isLoading}>
                <Plus className="mr-2 h-4 w-4" />
                Generate Fees
            </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : students.length}</div>
            <p className="text-xs text-muted-foreground">
              Active students in organization
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            You can generate a new fee batch by clicking the "Generate Fees" button.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Plus className="h-10 w-10" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No fees generated yet</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                You haven't generated any fees for this academic year. Click the button above to start.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <FeeGenerationDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        students={students}
      />
    </div>
  );
}
