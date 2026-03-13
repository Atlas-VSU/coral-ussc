import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileSpreadsheet, Upload, Info, CheckCircle2, Clock } from "lucide-react";
import { downloadCSVTemplate } from "../csv.utils";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File) => void;
  isImporting?: boolean;
  // Progress details for batch processing
  totalStudents?: number;           // e.g., 9000
  batchSize?: number;               // e.g., 400
  importProgress?: number;           // 0-100
  currentBatch?: number;             // current batch index (1-based)
  totalBatches?: number;             // total batches (derived or passed)
}

export function BulkImportDialog({
  open,
  onOpenChange,
  onImport,
  isImporting = false,
  totalStudents = 9000,
  batchSize = 200,
  importProgress = 0,
  currentBatch = 0,
  totalBatches = Math.ceil(totalStudents / batchSize),
}: BulkImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setFile(null);
      setAgreed(false);
    }
  }, [open]);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const uploadedFile = e.dataTransfer.files[0];
      if (
        uploadedFile.type === "text/csv" ||
        uploadedFile.name.endsWith(".csv")
      ) {
        setFile(uploadedFile);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const uploadedFile = e.target.files[0];
      if (
        uploadedFile.type === "text/csv" ||
        uploadedFile.name.endsWith(".csv")
      ) {
        setFile(uploadedFile);
      }
    }
  };

  const handleImport = () => {
    if (file && agreed && !isImporting) {
      onImport(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDownloadTemplate = async () => {
    downloadCSVTemplate();
  };

  const handleBrowseFile = () => {
    document.getElementById("file-upload")?.click();
  };

  const handleClose = () => {
    if (!isImporting) {
      onOpenChange(false);
    }
  };

  // Estimated remaining time message
  const estimatedTimeMessage = (() => {
    if (!isImporting || currentBatch === 0 || totalBatches === 0) return "";
    const remainingBatches = totalBatches - currentBatch;
    // Assuming each batch takes roughly 15 seconds (including sleep)
    const secondsRemaining = remainingBatches * 15; // rough estimate
    if (secondsRemaining < 60) {
      return `About ${secondsRemaining} seconds remaining`;
    }
    const minutes = Math.ceil(secondsRemaining / 60);
    return `About ${minutes} minute${minutes > 1 ? "s" : ""} remaining`;
  })();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-5xl w-[90vw] overflow-y-auto max-h-[90vh] py-8"
        showCloseButton={!isImporting}
      >
        <DialogHeader>
          <DialogTitle>Bulk Import Members</DialogTitle>
          <DialogDescription>
            {isImporting
              ? "Processing your file in batches. Please wait..."
              : "Upload a CSV file containing member information."}
          </DialogDescription>
        </DialogHeader>

        {isImporting ? (
          // Progress view during import
          <div className="space-y-6 py-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Import in Progress
                </CardTitle>
                <CardDescription>
                  Processing {totalStudents.toLocaleString()} students in batches of {batchSize}.
                  This may take a few minutes. Please do not close this dialog.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{file?.name}</span>
                  <span className="text-muted-foreground">
                    {importProgress.toFixed(0)}% complete
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  ></div>
                </div>

                {/* Batch info */}
                {currentBatch > 0 && totalBatches > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      Batch {currentBatch} of {totalBatches}
                    </span>
                    <span>{estimatedTimeMessage}</span>
                  </div>
                )}

                {/* Optional: detailed stats */}
                <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4 mt-2">
                  <div>
                    <span className="text-muted-foreground">Total students</span>
                    <p className="font-medium">{totalStudents.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Batch size</span>
                    <p className="font-medium">{batchSize}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Upload view (existing)
          <div className="space-y-4 py-4">
            {/* File template info */}
            <Card className="bg-muted/30 py-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  Required File Format
                </CardTitle>
                <CardDescription>
                  Your file must contain the following columns. Download our
                  template for reference.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="md:hidden space-y-3">
                  <div className="grid gap-2">
                    {[
                      {
                        name: "studentId",
                        desc: "Student ID number",
                        required: true,
                      },
                      { name: "firstName", desc: "First name", required: true },
                      { name: "lastName", desc: "Last name", required: true },
                      { name: "email", desc: "Email address", required: true },
                      {
                        name: "programId",
                        desc: "Program Name (see list of programs)",
                        required: true,
                      },
                      {
                        name: "facultyId",
                        desc: "Faculty Name (see list of faculties)",
                        required: true,
                      },
                      {
                        name: "yearLevel",
                        desc: "Year level (1-6, optional)",
                        required: false,
                      },
                    ].map((field) => (
                      <div key={field.name} className="border rounded-md p-3">
                        <div className="flex justify-between items-center">
                          <div className="font-medium text-xs">{field.name}</div>
                          {field.required && (
                            <span className="inline-flex items-center text-xs text-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Required
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {field.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-40">Column Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-20 text-center">
                          Required
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs">
                      <TableRow>
                        <TableCell>studentId</TableCell>
                        <TableCell>Student ID number</TableCell>
                        <TableCell className="text-center">
                          <CheckCircle2 className="h-3 w-3 text-green-600 inline" />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>firstName</TableCell>
                        <TableCell>First name</TableCell>
                        <TableCell className="text-center">
                          <CheckCircle2 className="h-3 w-3 text-green-600 inline" />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>lastName</TableCell>
                        <TableCell>Last name</TableCell>
                        <TableCell className="text-center">
                          <CheckCircle2 className="h-3 w-3 text-green-600 inline" />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>email</TableCell>
                        <TableCell>Email address</TableCell>
                        <TableCell className="text-center">
                          <CheckCircle2 className="h-3 w-3 text-green-600 inline" />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>programId</TableCell>
                        <TableCell>Program Name (see list of programs)</TableCell>
                        <TableCell className="text-center">
                          <CheckCircle2 className="h-3 w-3 text-green-600 inline" />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>facultyId</TableCell>
                        <TableCell>Faculty Name (see list of faculties)</TableCell>
                        <TableCell className="text-center">
                          <CheckCircle2 className="h-3 w-3 text-green-600 inline" />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>yearLevel</TableCell>
                        <TableCell>Year level (1-6, optional)</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={handleDownloadTemplate}
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                    Download Template
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* File upload section */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : file
                  ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                  : "border-border"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleFileDrop}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isImporting}
              />

              {file ? (
                <div className="flex flex-col items-center">
                  <FileSpreadsheet className="h-8 w-8 text-green-500 mb-2" />
                  <p className="font-medium text-blue-500">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 bg-gray-200 hover:bg-gray-300 text-dark dark:text-blue-400 dark:hover:text-white-300"
                    onClick={() => setFile(null)}
                  >
                    Change File
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="font-medium">Drag & drop your file here</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Supported formats: CSV
                  </p>
                  <Label htmlFor="file-upload" asChild>
                    <Button variant="secondary" size="sm" onClick={handleBrowseFile}>
                      Browse Files
                    </Button>
                  </Label>
                </div>
              )}
            </div>

            {/* Terms agreement */}
            <div className="bg-muted/50 p-4 rounded-md border">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={agreed}
                  onCheckedChange={(checked: boolean) => setAgreed(checked === true)}
                  className="mt-0.5"
                />
                <div>
                  <Label htmlFor="terms" className="text-xs leading-relaxed">
                    I confirm that I have obtained consent from all individuals
                    whose personal information is included in this file and that I
                    am authorized to share this data. I understand that I am
                    responsible for the accuracy of this data and any implications
                    of importing incorrect information.
                  </Label>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            Cancel
          </Button>
          {!isImporting ? (
            <Button onClick={handleImport} disabled={!file || !agreed}>
              <Upload className="h-4 w-4 mr-2" />
              Import Members
            </Button>
          ) : (
            <Button disabled>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Importing...
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}