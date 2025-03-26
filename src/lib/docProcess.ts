
import { Comment } from "@/components/CommentResponseCard";
import { openAIService } from "./openai";

// Process document and extract comments
export const processDocument = async (file: File): Promise<Comment[]> => {
  try {
    // In a real implementation, we would parse the document file here
    // For now, create a demo version that simulates real processing
    
    // Create a FormData object to send the file for processing
    const formData = new FormData();
    formData.append('document', file);
    
    // Simulate document processing by extracting text context
    // In a production app, this would call a backend API to process the document
    const fileText = await readFileAsText(file);
    const sections = extractSections(fileText);
    
    // Generate comments based on the document sections
    const extractedComments = generateCommentsFromSections(sections);
    
    // Generate AI responses if API key is available
    if (openAIService.getApiKey()) {
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
    throw new Error("Failed to process document");
  }
};

// Helper function to read file as text
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = () => reject(new Error("File reading error"));
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
