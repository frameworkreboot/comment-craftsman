
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import FileUploader from '@/components/FileUploader';
import ProcessingSpinner from '@/components/ProcessingSpinner';
import CommentResponseCard, { Comment } from '@/components/CommentResponseCard';
import ApiKeySettings from '@/components/ApiKeySettings';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { processDocument, exportDocumentWithResponses } from '@/lib/docProcess';
import { openAIService } from '@/lib/openai';
import { Download, Bug, ChevronDown, ChevronUp } from 'lucide-react';

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState<'idle' | 'analyzing' | 'generating' | 'complete'>('idle');
  const [comments, setComments] = useState<Comment[]>([]);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{message: string, timestamp: Date}[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const { toast } = useToast();
  
  const addDebugInfo = (message: string) => {
    setDebugInfo(prev => [...prev, {message, timestamp: new Date()}]);
  };

  useEffect(() => {
    // Check if API key exists on component mount
    setHasApiKey(!!openAIService.getApiKey());
    
    // Set up console log listener for debugging
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    console.log = (...args) => {
      originalConsoleLog(...args);
      addDebugInfo(`LOG: ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')}`);
    };
    
    console.error = (...args) => {
      originalConsoleError(...args);
      addDebugInfo(`ERROR: ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')}`);
    };
    
    console.warn = (...args) => {
      originalConsoleWarn(...args);
      addDebugInfo(`WARN: ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')}`);
    };
    
    return () => {
      // Restore original console methods
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  const handleApiKeySaved = () => {
    setHasApiKey(true);
    // Re-analyze the current file if one exists
    if (file && processing === 'complete') {
      handleFileSelected(file);
    }
  };

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    setProcessing('analyzing');
    setDebugInfo([]);
    
    addDebugInfo(`Starting to process file: ${selectedFile.name} (${selectedFile.type})`);
    
    try {
      // Process document and extract comments
      addDebugInfo('Extracting text from document...');
      setTimeout(() => setProcessing('generating'), 1500);
      
      const processedComments = await processDocument(selectedFile);
      addDebugInfo(`Extracted ${processedComments.length} comments from document`);
      
      setTimeout(() => {
        setComments(processedComments);
        setProcessing('complete');
        addDebugInfo('Processing complete');
      }, 1500);
    } catch (error) {
      console.error("Error processing file:", error);
      addDebugInfo(`Error processing file: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: "Processing error",
        description: "There was an error processing your document",
        variant: "destructive",
      });
      setProcessing('idle');
    }
  };

  const handleResponseChange = (id: string, newResponse: string) => {
    setComments(comments.map(comment => 
      comment.id === id ? { ...comment, response: newResponse } : comment
    ));
  };

  const handleExport = async () => {
    if (!file) {
      toast({
        title: "Export error",
        description: "No document to export",
        variant: "destructive",
      });
      return;
    }
    
    try {
      addDebugInfo('Starting export process...');
      const exportBlob = await exportDocumentWithResponses(comments, file);
      
      // Create a download link and trigger it
      const downloadUrl = URL.createObjectURL(exportBlob);
      const filename = `${file.name.split('.')[0]}_with_responses.txt`;
      
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Clean up the URL object
      URL.revokeObjectURL(downloadUrl);
      
      addDebugInfo(`Export successful: ${filename}`);
      toast({
        title: "Export successful",
        description: "Your document with responses has been downloaded",
      });
    } catch (error) {
      console.error("Export error:", error);
      addDebugInfo(`Export error: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: "Export error",
        description: "There was an error exporting your document",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setFile(null);
    setComments([]);
    setProcessing('idle');
    setDebugInfo([]);
    addDebugInfo('Reset application state');
  };

  const toggleDebugPanel = () => {
    setShowDebugPanel(!showDebugPanel);
  };

  return (
    <Layout>
      <Header />
      
      <div className="mt-12 max-w-4xl mx-auto">
        {(processing === 'idle' || !file) && (
          <div className="bg-white/40 backdrop-blur-sm shadow-soft rounded-xl p-8 border animate-fade-in">
            <h2 className="text-xl font-medium text-center mb-6">Upload a document with comments</h2>
            <FileUploader onFileSelected={handleFileSelected} />
            <p className="text-center text-sm text-muted-foreground mt-6">
              Supported file formats: Text (.txt), Microsoft Word (.docx) files with comments
            </p>
            
            {/* API Key Settings */}
            <div className="mt-8 pt-4 border-t">
              <div className="text-center">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Configure AI Response Generation</h3>
                <div className="flex justify-center">
                  <ApiKeySettings onKeySaved={handleApiKeySaved} />
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  {hasApiKey 
                    ? "✓ OpenAI API key is set. Your responses will be generated using AI."
                    : "Set your OpenAI API key to enable AI-generated responses."}
                </p>
              </div>
            </div>
          </div>
        )}

        {file && processing !== 'idle' && (
          <div className="mt-8 space-y-8 animate-fade-in">
            {processing !== 'complete' && (
              <div className="bg-white/40 backdrop-blur-sm shadow-soft rounded-xl p-8 border text-center">
                <ProcessingSpinner status={processing} />
                <p className="mt-4 text-sm text-muted-foreground">
                  {processing === 'analyzing' 
                    ? "Analyzing document content and extracting comments..." 
                    : "Generating contextually appropriate responses..."}
                </p>
              </div>
            )}

            {processing === 'complete' && (
              <div className="space-y-8">
                <div className="bg-white/40 backdrop-blur-sm shadow-soft rounded-xl p-6 border">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <ProcessingSpinner status="complete" className="scale-75" />
                      <div>
                        <h3 className="text-lg font-medium">{file.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {comments.length} comment{comments.length !== 1 ? 's' : ''} processed
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <ApiKeySettings onKeySaved={handleApiKeySaved} />
                      <Button variant="outline" onClick={handleReset}>
                        Process another document
                      </Button>
                      <Button className="gap-2" onClick={handleExport}>
                        <Download className="h-4 w-4" />
                        Export with responses
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium px-1">Review and edit responses</h3>
                  <p className="text-sm text-muted-foreground px-1 mb-4">
                    We've generated draft responses based on the document context and comments. Review and edit before exporting.
                  </p>
                  
                  <div className="space-y-6">
                    {comments.map(comment => (
                      <CommentResponseCard
                        key={comment.id}
                        comment={comment}
                        onResponseChange={handleResponseChange}
                      />
                    ))}
                  </div>
                  
                  <div className="mt-8 pt-4 flex justify-end">
                    <Button className="gap-2" onClick={handleExport}>
                      <Download className="h-4 w-4" />
                      Export with responses
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Debug Panel Button */}
        <div className="fixed bottom-4 right-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 bg-white/80" 
            onClick={toggleDebugPanel}
          >
            <Bug className="h-4 w-4" />
            Debug
            {showDebugPanel ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </Button>
        </div>
        
        {/* Debug Panel */}
        {showDebugPanel && (
          <div className="fixed bottom-14 right-4 w-96 max-h-96 overflow-auto bg-white/90 backdrop-blur-sm rounded-lg border shadow-lg p-4">
            <h3 className="font-medium text-sm mb-2 flex justify-between">
              <span>Document Processing Logs</span>
              <span className="text-xs text-muted-foreground">
                {debugInfo.length} entries
              </span>
            </h3>
            <div className="space-y-2 text-xs font-mono overflow-y-auto max-h-80">
              {debugInfo.length > 0 ? (
                debugInfo.map((info, index) => (
                  <div key={index} className={`p-1 rounded ${info.message.includes('ERROR') ? 'bg-red-50 text-red-800' : info.message.includes('WARN') ? 'bg-amber-50 text-amber-800' : 'bg-gray-50'}`}>
                    <span className="text-gray-500">[{info.timestamp.toLocaleTimeString()}]</span>{' '}
                    {info.message}
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground italic">No logs available yet</div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="mt-20 pt-8 border-t border-border/50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            First Word Responder — Automate your document comment responses while matching your writing style
          </p>
        </div>
      </footer>
    </Layout>
  );
};

export default Index;
