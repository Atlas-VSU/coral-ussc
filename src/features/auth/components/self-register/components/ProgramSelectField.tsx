import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  lightSelectTriggerClass,
  lightSelectContentClass,
  lightSelectItemClass,
  type ProgramOption,
  type SelfRegisterFormData,
} from "../constants";

interface ProgramSelectFieldProps {
  form: UseFormReturn<SelfRegisterFormData>;
  programOptions: ProgramOption[];
  isLoadingPrograms: boolean;
  programLoadError: string | null;
}

/** Program dropdown with loading / error states. */
export function ProgramSelectField({
  form,
  programOptions,
  isLoadingPrograms,
  programLoadError,
}: ProgramSelectFieldProps) {
  return (
    <FormField
      control={form.control}
      name="programId"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-[#1B5E20] font-semibold">
            Program
          </FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value}
            disabled={isLoadingPrograms}
          >
            <FormControl>
              <SelectTrigger className={lightSelectTriggerClass}>
                <SelectValue
                  placeholder={
                    isLoadingPrograms
                      ? "Loading programs…"
                      : "Select a program"
                  }
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent className={lightSelectContentClass}>
              {programOptions.map((program) => (
                <SelectItem
                  key={program.value}
                  value={program.value}
                  className={lightSelectItemClass}
                >
                  {program.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {programLoadError && (
            <p className="text-xs text-amber-600">
              {programLoadError}
            </p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
