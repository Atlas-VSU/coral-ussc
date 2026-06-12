"use client"

import { Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createOrg } from "@/firebase/organization";
import { Organization, Term } from "@/constants/types";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Faculty, Program } from "../../members/types";
import { countUsers, getFaculties, getPrograms } from "@/firebase";
import { OrgForm } from "./OrgForm";
import { createTerm } from "@/firebase/term";
import { TermForm } from "./TermForm";
import { countFines } from "@/firebase/fines/read/fines";

export default function TestingPage() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [showAddTermForm, setShowAddTermForm] = useState(false)
  const [loading, setLoading] = useState(false);
  const [faculties, setFaculties] = useState<Faculty[]>([]); 
  const [programs, setPrograms] = useState<Program[]>([]);

    const handleAddSubmit = async (data: Organization) => {
    try {
      setLoading(true)
      await createOrg(data);
      setShowAddForm(false)
    } catch (error) {
      console.error('Failed to add fine type:', error)
    } finally { 
      setLoading(false)
    }
  }

    const handleAddTermSubmit = async (data: Term) => {
    try {
      setLoading(true)
      await createTerm(data.AY, data.semester);
      setShowAddTermForm(false)
    } catch (error) {
      console.error('Failed to add Term:', error)
    } finally { 
      setLoading(false)
    }
  }

  const fetchPrograms = useCallback(async () => {
      try {
          const programs = await getPrograms() as Program[];
          setPrograms(programs);
      } catch (error) {
          console.error("Error fetching fine types:", error);
      }
    }, []);
    
    const fetchFaculties = useCallback(async () => {
      try {
          const faculties = await getFaculties() as Faculty[];
          setFaculties(faculties);
      } catch (error) {
          console.error("Error fetching fine types:", error);
      }
    }, []);

  const handleAddClick = async () => {
    setShowAddForm(true);
    if (faculties.length === 0) await fetchFaculties();
    if (programs.length === 0) await fetchPrograms();
  }
  
  const handleAddTermClick = async () => {
    setShowAddTermForm(true);
  }


  return (
    <div>
        <Button 
          onClick={handleAddClick} 
          size="sm"
          variant="success"
          className="gap-1.5 w-full sm:w-auto"
          disabled={showAddForm || loading}
        >
        <Plus className="size-4" /> Add Organization
      </Button>

      <Button 
          onClick={handleAddTermClick} 
          size="sm"
          variant="success"
          className="gap-1.5 w-full sm:w-auto"
          disabled={showAddTermForm || loading}
        >
        <Plus className="size-4" /> Add Term
      </Button>
      
      <div>
        {showAddForm && (
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Add Organization</CardTitle>
                <Button 
                  variant="icon" 
                  size="sm" 
                  onClick={() => setShowAddForm(false)}
                  disabled={loading}
                  className="h-8 w-8 p-0"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <OrgForm
                open={showAddForm}
                faculties={faculties}
                programs={programs}
                onSubmit={handleAddSubmit}
                onOpenChange={(isOpen) => setShowAddForm(isOpen)}
                onCancel={() => setShowAddForm(false)}
                isSubmitting={loading}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        {showAddTermForm && (
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Add Term</CardTitle>
                <Button 
                  variant="icon" 
                  size="sm" 
                  onClick={() => setShowAddTermForm(false)}
                  disabled={loading}
                  className="h-8 w-8 p-0"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <TermForm
                open={showAddTermForm}
                onSubmit={handleAddTermSubmit}
                onOpenChange={(isOpen) => setShowAddTermForm(isOpen)}
                onCancel={() => setShowAddTermForm(false)}
                isSubmitting={loading}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}