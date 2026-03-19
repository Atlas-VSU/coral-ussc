"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"

interface TableSkeletonProps {
  columns: number
  rows?: number
}

export function TableSkeleton({ columns, rows = 5 }: TableSkeletonProps) {
  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-4 w-[100px]" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex} className="border-border">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton className="h-5 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

interface CardGridSkeletonProps {
  count?: number
  className?: string
}

export function CardGridSkeleton({ count = 6, className = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" }: CardGridSkeletonProps) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-border bg-card">
          <CardContent className="p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-[140px]" />
                <Skeleton className="h-4 w-[80px]" />
              </div>
              <Skeleton className="h-6 w-[70px] rounded-full" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="py-2.5 px-3 rounded-md border border-border bg-muted/20">
              <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-[60px]" />
                <Skeleton className="h-6 w-[80px]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Skeleton className="h-3 w-[40px]" />
                <Skeleton className="h-4 w-[60px]" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-[40px]" />
                <Skeleton className="h-4 w-[60px]" />
              </div>
            </div>
            <Skeleton className="h-9 w-full rounded-md mt-1" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
