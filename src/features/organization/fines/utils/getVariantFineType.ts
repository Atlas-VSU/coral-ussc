export const getVariantFineType = (status: string) => {
    switch (status) {
      case "pending":  return "outline";
      case "partial":  return "outline";
      case "paid":     return "secondary";
      case "waived":   return "outline";
      case "unpaid":   return "destructive";
      default:         return "outline";
    }
  };