import { useState } from "react";
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
import { FileSpreadsheet, Upload, Info, CheckCircle2 } from "lucide-react";
import { downloadCSVTemplate } from "../csv.utils";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File) => void;
  isImporting?: boolean;
}

export function BulkImportDialog({
  open,
  onOpenChange,
  onImport,
  isImporting = false,
}: BulkImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const uploadedFile = e.dataTransfer.files[0];
      if (
        uploadedFile.type === "text/csv" ||
        uploadedFile.name.endsWith(".csv") ||
        uploadedFile.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        uploadedFile.name.endsWith(".xlsx")
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
        uploadedFile.name.endsWith(".csv") ||
        uploadedFile.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        uploadedFile.name.endsWith(".xlsx")
      ) {
        setFile(uploadedFile);
      }
    }
  };

  const handleImport = () => {
    if (file && agreed && !isImporting) {
      onImport(file);
      // Don't close dialog here - let parent handle it after import completes
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
    setFile(null);
    setAgreed(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl w-[90vw] overflow-y-auto max-h-[90vh] py-8">
        <DialogHeader>
          <DialogTitle>Bulk Import Members</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file containing member information.
          </DialogDescription>
        </DialogHeader>

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
                      desc: "Program ID (see list of programs)",
                      required: true,
                    },
                    {
                      name: "facultyId",
                      desc: "Faculty ID (see list of faculties)",
                      required: true,
                    },
                    {
                      name: "yearLevel",
                      desc: "Year level (1-5, optional)",
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
                      <TableCell>Program ID (see list of programs)</TableCell>
                      <TableCell className="text-center">
                        <CheckCircle2 className="h-3 w-3 text-green-600 inline" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>facultyId</TableCell>
                      <TableCell>Faculty ID (see list of faculties)</TableCell>
                      <TableCell className="text-center">
                        <CheckCircle2 className="h-3 w-3 text-green-600 inline" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>yearLevel</TableCell>
                      <TableCell>Year level (1-5, optional)</TableCell>
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
              isImporting
                ? "border-gray-300 bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                : dragActive
                ? "border-primary bg-primary/5"
                : file
                ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                : "border-border"
            }`}
            onDragOver={isImporting ? undefined : handleDragOver}
            onDragLeave={isImporting ? undefined : handleDragLeave}
            onDrop={isImporting ? undefined : handleFileDrop}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".csv,.xlsx"
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
                {isImporting ? (
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                    Processing file...
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 bg-gray-200 hover:bg-gray-300 text-dark dark:text-blue-400 dark:hover:text-white-300"
                    onClick={() => setFile(null)}
                  >
                    Change File
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="font-medium">Drag & drop your file here</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Supported formats: CSV, Excel (.xlsx)
                </p>
                <Label htmlFor="file-upload" asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleBrowseFile}
                    disabled={isImporting}
                  >
                    Browse Files
                  </Button>
                </Label>
              </div>
            )}
          </div>

          {/* Terms agreement */}
          <div className={`bg-muted/50 p-4 rounded-md border ${isImporting ? 'opacity-50' : ''}`}>
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={agreed}
                onCheckedChange={(checked) => {
                  if (!isImporting) {
                    setAgreed(checked === true);
                  }
                }}
                className="mt-0.5"
                disabled={isImporting}
              />
              <div>
                <Label htmlFor="terms" className={`text-xs leading-relaxed ${isImporting ? 'cursor-not-allowed' : ''}`}>
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

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file || !agreed || isImporting}>
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import Members
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
