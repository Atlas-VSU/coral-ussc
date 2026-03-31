

export function FineBreakdownSkeleton() {
    return (
        <div className="flex flex-col gap-4 animate-pulse w-full pt-2">
            <div className="flex flex-col gap-2.5 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="size-4 bg-gray-200 rounded-full" />
                        <div className="h-4 w-32 bg-gray-200 rounded" />
                        <div className="h-5 w-16 bg-gray-200 rounded-full" />
                    </div>
                    <div className="h-8 w-24 bg-gray-200 rounded" />
                </div>
                <div className="h-3 w-3/4 bg-gray-200 rounded mt-1" />
            </div>

            <div className="flex flex-col gap-3">
                {[1, 2, 3].map((key) => (
                    <div key={key} className="rounded-lg border border-gray-100 p-4 flex flex-col gap-3 bg-gray-50/50">
                
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-6 bg-gray-200 rounded" />
                                <div className="h-4 w-12 bg-gray-200 rounded-full" />
                            </div>
                            <div className="h-5 w-16 bg-gray-200 rounded" />
                        </div>

                        <div className="h-4 w-48 bg-gray-200 rounded" />

                    
                        <div className="flex gap-4">
                            <div className="h-3 w-24 bg-gray-200 rounded" />
                            <div className="h-3 w-32 bg-gray-200 rounded" />
                        </div>

                    
                        <div className="border-t border-gray-100 pt-3 mt-1">
                            <div className="h-3 w-full bg-gray-200 rounded mb-1.5" />
                            <div className="h-3 w-5/6 bg-gray-200 rounded" />
                        </div>

                     
                        <div className="h-8 w-32 bg-gray-200 rounded self-end mt-1" />
                    </div>
                ))}
            </div>

       
            <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 mt-1">
                <div className="h-4 w-40 bg-gray-200 rounded" />
                <div className="h-5 w-20 bg-gray-200 rounded" />
            </div>
        </div>
    );
}