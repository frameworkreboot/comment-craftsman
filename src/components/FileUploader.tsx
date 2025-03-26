
import React, { useState, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { FileUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelected,
  accept = ".docx",
  maxSize = 10, // Default 10MB max
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFile = (file: File): boolean => {
    // Check file type
    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (fileType !== 'docx') {
      toast({
        title: "Invalid file type",
        description: "Please upload a Word document (.docx)",
        variant: "destructive",
      });
      return false;
    }

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${maxSize}MB`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelected(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelected(file);
      }
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />
      
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 transition-all",
            "flex flex-col items-center justify-center gap-4",
            "text-center cursor-pointer",
            isDragging 
              ? "border-primary bg-primary/5 scale-[1.02]" 
              : "border-border bg-secondary/50 hover:bg-secondary/80 hover:border-muted-foreground/50"
          )}
          onClick={handleBrowseClick}
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse-subtle">
            <FileUp className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-lg">Upload your document</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Drag and drop your Word document, or click to browse
            </p>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Only .docx files up to {maxSize}MB are supported
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-6 glass animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileUp className="h-5 w-5 text-primary" />
              </div>
              <div className="truncate">
                <p className="font-medium truncate max-w-[220px]">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemoveFile}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
