import { Skeleton } from "@/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export function TableSkeleton({ rows = 6, cols = 6 }: TableSkeletonProps) {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <TableRow key={rowIdx} className="hover:bg-transparent">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <TableCell key={colIdx}>
              <Skeleton
                className="h-4 rounded"
                style={{ width: colIdx === 0 ? "60%" : colIdx === cols - 1 ? "40%" : "75%" }}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}
