"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentVerificationPage() {
  const [studentId, setStudentId] = useState("");
  const [program, setProgram] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Student ID:", studentId);
    console.log("Program:", program);
    // TODO: Handle form submission
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-4">
          <CardTitle>Student Payment Portal</CardTitle>
          <CardDescription>Enter your student information to continue</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student ID Input */}
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                placeholder="21-1-12345"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">Format: XX-X-XXXXX</p>
            </div>

            {/* Program Selection */}
            <div className="space-y-2">
              <Label htmlFor="program">Program</Label>
              <select
                id="program"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">Select your program</option>
                <option value="bscs">Bachelor of Science in Computer Science</option>
                <option value="bsit">Bachelor of Science in Information Technology</option>
                <option value="bsce">Bachelor of Science in Civil Engineering</option>
                <option value="bsee">Bachelor of Science in Electrical Engineering</option>
              </select>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full mb-6">
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
