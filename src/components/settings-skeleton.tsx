import { Skeleton } from "@/components/ui/skeleton"

export function SettingsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl p-4">
      <div className="mb-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>
      
      <div className="space-y-6">
        {/* Display Name Field */}
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        
        {/* Language Field */}
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        
        {/* Theme Scheme Field */}
        <div>
          <Skeleton className="h-4 w-40 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        
        {/* Theme Color Field */}
        <div>
          <Skeleton className="h-4 w-36 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        
        {/* Save Button */}
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}