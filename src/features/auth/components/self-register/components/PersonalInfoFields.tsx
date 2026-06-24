import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  lightInputClass,
  type SelfRegisterFormData,
} from "../constants";

interface PersonalInfoFieldsProps {
  form: UseFormReturn<SelfRegisterFormData>;
}

/** Student ID, email, first name, and last name fields. */
export function PersonalInfoFields({ form }: PersonalInfoFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="studentId"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[#1B5E20] font-semibold">
              Student ID
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="xx-x-xxxxx"
                className={lightInputClass}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[#1B5E20] font-semibold">
              Email
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                type="email"
                placeholder="your_address@gmail.com"
                className={lightInputClass}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="firstName"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[#1B5E20] font-semibold">
              First Name
            </FormLabel>
            <FormControl>
              <Input {...field} className={lightInputClass} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="lastName"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[#1B5E20] font-semibold">
              Last Name
            </FormLabel>
            <FormControl>
              <Input {...field} className={lightInputClass} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
