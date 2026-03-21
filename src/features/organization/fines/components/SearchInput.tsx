"use client"

import { Search } from "lucide-react"
import { Input } from "../../../../components/ui/input"
import { cn } from "@/lib/utils"


interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Class applied to the outer wrapper div (use this for width, e.g. "w-56") */
  className?: string
}

export function SearchInput({ value, onChange, placeholder = "Search Name or Student ID...", className }: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="pl-8 w-full"
      />
    </div>
  )
}
