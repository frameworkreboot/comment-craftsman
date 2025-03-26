
import { Comment } from "@/components/CommentResponseCard";
import { openAIService } from "./openai";

// Process document and extract comments
export const processDocument = async (file: File): Promise<Comment[]> => {
  try {
    console.log("Processing document:", file.name, "Type:", file.type);
    
    // Check if it's actually a Word document
    if (file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      console.warn("File may not be a valid Word document. Type:", file.type);
    }
    
    // Create a FormData object to send the file for processing
    const formData = new FormData();
    formData.append('document', file);
    
    // Extract text from the document
    const fileText = await readFileAsText(file);
    console.log("Successfully extracted text, length:", fileText.length);
    
    // Extract sections from the document
    const sections = extractSections(fileText);
    console.log("Extracted sections:", sections.length);
    
    // Generate comments based on the document sections
    const extractedComments = generateCommentsFromSections(sections);
    console.log("Generated comments:", extractedComments.length);
    
    // Generate AI responses if API key is available
    if (openAIService.getApiKey()) {
      console.log("API key found, generating AI responses");
      const commentsWithResponses = await Promise.all(
        extractedComments.map(async (comment) => {
          try {
            const aiResponse = await openAIService.generateResponse(
              comment.text,
              comment.context
            );
            return { ...comment, response: aiResponse };
          } catch (error) {
            console.error(`Failed to generate response for comment ${comment.id}:`, error);
            return comment;
          }
        })
      );
      return commentsWithResponses;
    }
    
    return extractedComments;
  } catch (error) {
    console.error("Error processing document:", error);
    throw new Error(`Failed to process document: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Helper function to read file as text
const readFileAsText = async (file: File): Promise<string> => {
  // Currently this only works with text files, not actual Word documents
  // In production, this would call a server API to extract text from docx
  console.log("Attempting to read file:", file.name);
  
  if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    console.log("This is a Word document (.docx). In a production app, we would use a library like mammoth.js or call a backend API to extract the text.");
    // For demo purposes, we'll return a placeholder text for Word documents
    return `# Sample Document Content
    
This is simulated content from a Word document.

## Introduction
This document discusses important concepts that need review.

## Methods
The methodology described here has several limitations.

## Results
The results show promising outcomes, but further validation is needed.

## Discussion
Several points in this section could use additional clarification.

## Conclusion
The conclusions drawn should be considered preliminary.`;
  }
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        console.log("File read successfully");
        resolve(event.target.result as string);
      } else {
        reject(new Error("Failed to read file: No content"));
      }
    };
    reader.onerror = (e) => {
      console.error("Error reading file:", e);
      reject(new Error("File reading error"));
    };
    reader.readAsText(file);
  });
};

// Extract sections from document text
const extractSections = (text: string): string[] => {
  // In a real implementation, this would use more sophisticated parsing
  // For demo purposes, split by paragraphs or headers
  const sections = text.split(/\n\n+/);
  return sections.filter(section => section.trim().length > 0);
};

// Generate comments from document sections
const generateCommentsFromSections = (sections: string[]): Comment[] => {
  const authors = ["John Doe", "Jane Smith", "Alex Johnson", "Maria Garcia", "Wei Chen"];
  const commentTypes = [
    "This section could use more clarity. Can you expand on the key concepts?",
    "Consider adding a figure here to illustrate this process.",
    "This conclusion seems too strong given the limitations discussed earlier.",
    "The methodology described here doesn't align with the introduction.",
    "Can you provide more recent references for this claim?",
    "This paragraph contains redundant information.",
    "The transition between these sections is abrupt. Consider adding a connecting sentence."
  ];
  
  // Use at most 5 sections for comments
  const usableSections = sections.slice(0, Math.min(sections.length, 5));
  
  return usableSections.map((section, index) => {
    // Generate a random author and comment type for each section
    const author = authors[Math.floor(Math.random() * authors.length)];
    const commentText = commentTypes[Math.floor(Math.random() * commentTypes.length)];
    
    return {
      id: `comment-${index + 1}`,
      author,
      date: new Date(Date.now() - (index * 86400000)).toISOString(),
      text: commentText,
      context: section.substring(0, Math.min(section.length, 200)),
      response: ""
    };
  });
};

// Export document with responses
export const exportDocumentWithResponses = async (comments: Comment[], originalFile: File): Promise<Blob> => {
  try {
    console.log("Exporting document with responses:", comments.length, "comments");
    
    // In a real implementation, this would generate a new document with responses
    // For this demo, create a simple text file with the comments and responses
    
    const content = generateExportContent(comments, originalFile.name);
    const blob = new Blob([content], { type: 'text/plain' });
    return blob;
  } catch (error) {
    console.error("Error exporting document:", error);
    throw new Error("Failed to export document");
  }
};

// Generate export content
const generateExportContent = (comments: Comment[], fileName: string): string => {
  let content = `# Document Comments and Responses\n`;
  content += `Original Document: ${fileName}\n`;
  content += `Generated on: ${new Date().toLocaleString()}\n\n`;
  
  comments.forEach((comment, index) => {
    content += `## Comment ${index + 1}\n`;
    content += `From: ${comment.author}\n`;
    content += `Date: ${new Date(comment.date || Date.now()).toLocaleString()}\n\n`;
    content += `### Comment Text:\n${comment.text}\n\n`;
    content += `### Context:\n${comment.context}\n\n`;
    content += `### Response:\n${comment.response || "No response provided."}\n\n`;
    content += `---\n\n`;
  });
  
  return content;
};
