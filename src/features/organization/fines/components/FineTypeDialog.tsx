"use client"

import { useState } from "react"
import { 
  Plus, 
  Trash2, 
  AlertCircle, 
  Clock, 
  Calendar, 
  Power, 
  Edit,
  X,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../local-components/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../local-components/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { FineType } from "../types"
import { FineTypeForm } from "./FineTypeForm"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface FineTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fineTypes: FineType[]
  onAddFineType: (fineType: FineType) => Promise<void>
  onUpdateFineType: (id: string, fineType: FineType) => Promise<void>
  onDeleteFineType: (id: string) => Promise<void>
  isProcessing?: boolean
  fetchFineTypes: () => Promise<void>
}

export function FineTypeDialog({
  open,
  onOpenChange,
  fineTypes,
  onAddFineType,
  onUpdateFineType,
  onDeleteFineType,
  isProcessing = false,
  fetchFineTypes,
}: FineTypeDialogProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingFine, setEditingFine] = useState<FineType | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FineType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  const handleAddSubmit = async (data: FineType) => {
    try {
      setIsSubmitting(true)
      await onAddFineType(data)
      setShowAddForm(false)
    } catch (error) {
      console.error('Failed to add fine type:', error)
    } finally { 
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (data: FineType) => {
    if (!editingFine?.id) return
    
    try {
      setIsSubmitting(true)
      await onUpdateFineType(editingFine.id, data)
      setEditingFine(null)
    } catch (error) {
      console.error('Failed to update fine type:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget?.id) return
    
    try {
      setIsSubmitting(true)
      await onDeleteFineType(deleteTarget.id)
      setDeleteTarget(null)
    } catch (error) {
      console.error('Failed to delete fine type:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleCardExpansion = (fineId: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(fineId)) {
      newExpanded.delete(fineId)
    } else {
      newExpanded.add(fineId)
    }
    setExpandedCards(newExpanded)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const activeCount = fineTypes.filter(f => f.isActive).length
  const inactiveCount = fineTypes.filter(f => !f.isActive).length

  return (
    <>
      {/* Main Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-white max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 gap-0 border-none">
        
          <DialogHeader className="p-6 pb-2 sticky top-0 bg-white z-10 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-xl text-[#1B5E20] font-bold uppercase">Fine Types</DialogTitle>
                <DialogDescription>
                  Manage fine types, their amounts, and requirements.
                </DialogDescription>
              </div>
              <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 hover:bg-[#5bb651] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-20">
                <X className="h-4 w-4 text-[#1B5E20]" />
                <span className="sr-only">Close</span>
              </DialogClose>
              <Button 
                onClick={() => setShowAddForm(true)} 
                size="sm"
                className="text-[#000000]  gap-1.5 w-full sm:w-auto bg-linear-to-r from-[#8BC34A] via-[#6ac947] to-[#55c72c]"
                disabled={showAddForm || isProcessing}
              >
                <Plus className="size-4" /> Add Fine Type
              </Button>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-6">
            {/* Add Form */}
            {showAddForm && (
              <Card className="border-2 border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">Add New Fine Type</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowAddForm(false)}
                      disabled={isSubmitting}
                      className="h-8 w-8 p-0"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <FineTypeForm
                    open={showAddForm}
                    onSubmit={handleAddSubmit}
                    onOpenChange={() => setShowAddForm(true)}
                    onCancel={() => setShowAddForm(false)}
                    isSubmitting={isSubmitting}
                    fetchFineTypes={fetchFineTypes}
                  />
                </CardContent>
              </Card>
            )}

            {/* Edit Form */}
            {editingFine && (
              <Card className="border-2 border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">Edit Fine Type</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setEditingFine(null)}
                      disabled={isSubmitting}
                      className="h-8 w-8 p-0"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <FineTypeForm
                    open={!!editingFine}
                    initialData={editingFine}
                    onSubmit={handleEditSubmit}
                    onOpenChange={() => setEditingFine(null)}
                    onCancel={() => setEditingFine(null)}
                    isSubmitting={isSubmitting}
                    fetchFineTypes={fetchFineTypes}
                  />
                </CardContent>
              </Card>
            )}


            {/* Fine Types Grid */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-[#1B5E20]">All Fine Types</h3>
              
              {fineTypes.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="size-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground text-center">
                      No fine types found. Click "Add Fine Type" to create one.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {fineTypes.map((fine) => (
                    <Card key={fine.id} className={cn(
                      "transition-all duration-200 bg-white",
                      !fine.isActive && "opacity-75"
                    )}>
                      <CardHeader className="pb-0 text-[#1B5E20]">
                        <div className="flex items-start justify-between ">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base font-semibold ">
                                {fine.name}
                              </CardTitle>
                              <Badge 
                                variant={fine.isActive ? "default" : "secondary"}
                                className={cn(
                                  "text-[10px] text-black",
                                  fine.isActive && "bg-[#5bb651] hover:bg-[#3b9931]"
                                )}
                              >
                                {fine.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <CardDescription className="text-sm line-clamp-2 text-[#030a04]">
                              {fine.description}
                            </CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-[#000000] !hover:bg-[#5bb651]"
                            onClick={() => toggleCardExpansion(fine.id!)}
                          >
                            {expandedCards.has(fine.id!) ? (
                              <ChevronUp className="size-4" />
                            ) : (
                              <ChevronDown className="size-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      
                      <CardContent className={cn(
                        "pb-3 transition-all",
                        !expandedCards.has(fine.id!) && "hidden"
                      )}>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3 text-[#030a04]">
                            <div>
                              <p className="text-xs mb-1">Amount</p>
                              <p className="font-mono font-semibold text-base">
                                {formatCurrency(fine.defaultAmount)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs mb-1">Requirements</p>
                              <div className="flex flex-wrap gap-1 ">
                                {fine.requiresTimeIn && (
                                  <Badge variant="outline" className="text-[#030a04] text-[10px] flex items-center gap-1">
                                    <Clock className="size-2.5" /> Time In
                                  </Badge>
                                )}
                                {fine.requiresTimeOut && (
                                  <Badge variant="outline" className="text-[#030a04] text-[10px] flex items-center gap-1">
                                    <Clock className="size-2.5" /> Time Out
                                  </Badge>
                                )}
                                {fine.majorEventsOnly && (
                                  <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                                    <Calendar className="size-2.5" /> Major Events
                                  </Badge>
                                )}
                                {!fine.requiresTimeIn && !fine.requiresTimeOut && !fine.majorEventsOnly && (
                                  <span className="text-xs text-muted-foreground">No requirements</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter className="pt-2 border-t">
                        <div className="flex items-center justify-end gap-1 w-full">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setEditingFine(fine)}
                            disabled={isProcessing || showAddForm}
                            title="Edit"
                          >
                            <Edit className="size-3.5 text-[#1B5E20]" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(fine)}
                            disabled={isProcessing || showAddForm}
                            title="Delete"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>

      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fine Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
              {deleteTarget?.isActive && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This fine type is currently active.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90 gap-2"
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}