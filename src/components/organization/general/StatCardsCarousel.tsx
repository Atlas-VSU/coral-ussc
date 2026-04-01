"use client"

import React from "react"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

interface StatCardsCarouselProps {
  children: React.ReactNode
  className?: string
}

export function StatCardsCarousel({ children, className }: StatCardsCarouselProps) {
  return (
    <>
      {/* Carousel for mobile/tablet (< lg) */}
      <div className="lg:hidden">
        <div className="relative px-8">
          <Carousel
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 sm:-ml-4">
              {React.Children.map(children, (child, index) => (
                <CarouselItem key={index} className="pl-2 sm:pl-4 basis-full sm:basis-1/2">
                  {child}
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute -left-6 top-1/2 -translate-y-1/2 size-8 border-border/50 hover:border-primary/50 hover:bg-primary/5" />
            <CarouselNext className="absolute -right-6 top-1/2 -translate-y-1/2 size-8 border-border/50 hover:border-primary/50 hover:bg-primary/5" />
          </Carousel>
        </div>
      </div>

      {/* Grid for desktop (>= lg) */}
      <div className={cn("hidden lg:grid gap-4", className)}>
        {children}
      </div>
    </>
  )
}
