"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

interface StatCardsCarouselProps {
  children: React.ReactNode
  className?: string
}

export function StatCardsCarousel({ children, className }: StatCardsCarouselProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!api) return

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap())

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])

  const scrollTo = useCallback((index: number) => {
    api?.scrollTo(index)
  }, [api])

  return (
    <>
      {/* Carousel for mobile/tablet (< lg) */}
      <div className="lg:hidden">
        <div className="relative">
          <Carousel
            setApi={setApi}
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
          </Carousel>
          
          {/* Dot indicators */}
          {count > 1 && (
            <div className="flex justify-center gap-1.5 mt-4">
              {Array.from({ length: count }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollTo(index)}
                  className={cn(
                    "size-2 rounded-full transition-all",
                    current === index
                      ? "bg-primary w-6"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid for desktop (>= lg) */}
      <div className={cn("hidden lg:grid gap-4", className)}>
        {children}
      </div>
    </>
  )
}
