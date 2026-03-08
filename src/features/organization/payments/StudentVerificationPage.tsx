"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
              <Select value={program} onValueChange={setProgram} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bscs">Bachelor of Science in Computer Science</SelectItem>
                  <SelectItem value="bsit">Bachelor of Science in Information Technology</SelectItem>
                  <SelectItem value="bsce">Bachelor of Science in Civil Engineering</SelectItem>
                  <SelectItem value="bsee">Bachelor of Science in Electrical Engineering</SelectItem>
                </SelectContent>
              </Select>
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
