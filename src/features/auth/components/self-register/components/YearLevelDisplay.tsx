import type { UseFormReturn } from "react-hook-form";
import { lightSelectContentClass, lightSelectTriggerClass, YEAR_LEVELS, type SelfRegisterFormData } from "../constants";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { SelectContent, SelectItem } from "@radix-ui/react-select";
import { Control } from "react-hook-form";

interface YearLevelSelectionProps {
  form: UseFormReturn<SelfRegisterFormData>;
}
/** Students select their year level. */
export function YearLevelSelection({
  form,
}: YearLevelSelectionProps) {
  return (
    <FormField
      control={form.control}
      name="yearLevel"
      render={({ field }) => (
         <FormItem>
          <FormLabel className="text-[#1B5E20] font-semibold">
            Year Level
          </FormLabel>
          
            <Select
              onValueChange={(value) => field.onChange(value)}
              value={String(field.value)}
            >
              <FormControl>
                <SelectTrigger className={lightSelectTriggerClass}>
                  <SelectValue
                    placeholder={
                      "Select your year level"}
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent className={lightSelectContentClass}>
                {YEAR_LEVELS.map((level) => (
                  <SelectItem key={level} value={String(level)}>
                    {level}st Year
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
           </FormItem>
      )}
    />
  );
}
