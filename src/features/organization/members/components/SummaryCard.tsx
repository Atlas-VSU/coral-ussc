import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type SummaryCardProps = {
  icon: React.ElementType;
  title: string;
  value: number;
  description: string;
  colorClass: string;
};

export const SummaryCard = ({
  icon: Icon,
  title,
  value,
  description,
  colorClass,
}: SummaryCardProps) => (
  <Card
    className={`border-l-4 ${colorClass} w-[100%] h-[90%] bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 hover:shadow-lg transition-all duration-300 backdrop-blur-sm border-blue-200/60`}
  >
    <CardHeader className="p-0">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center bg-blue-100">
            <Icon className="w-2 h-2 md:w-6 md:h-6 text-blue-600" />
            </div>
            <CardTitle className="text-sm font-bold truncate text-gray-900">
            {title}
          </CardTitle>
        </div>       
      </div>
    </CardHeader>

    <CardContent className="p-4 pt-2">
      <div className="flex flex-rows sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
            {value.toLocaleString()}
          </div>
          {/* description shown on small screens below the value */}
          <span className="hidden sm:inline text-xs text-gray-500">
          {description}
        </span>
        </div>
        {/* description shown on larger screens to the right of the value */}
        <span className="sm:hidden text-xs text-gray-500">
          {description}
        </span>
      </div>

    </CardContent>
  </Card>
);
