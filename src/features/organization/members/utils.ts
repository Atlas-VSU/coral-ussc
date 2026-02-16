export const exportErrorsToCSV = (errors: Array<{ row: number; studentId: string; error: string }>) => {
  if (errors.length === 0) return;

  const headers = ["Row", "Student ID", "Error"];
  const csvContent = [
    headers.join(","),
    ...errors.map(
      (error) =>
        `"${error.row}","${error.studentId}","${error.error.replace(
          /"/g,
          '""'
        )}"`
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "import_errors.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
