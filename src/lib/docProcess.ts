import { Comment } from "@/components/CommentResponseCard";
import { openAIService } from "./openai";
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { DOMParser } from 'xmldom';
import { saveAs } from 'file-saver';

// Interface for Word document comments
interface WordComment {
  id: string;
  author: string;
  text: string;
  date: string;
  contextReference: string;
}

// Helper function to extract actual Word comments (not text that looks like comments)
const extractWordComments = async (file: File): Promise<WordComment[]> => {
  console.log("Extracting Word comments from document");
  
  try {
    // Read the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Use JSZip to extract the comments XML
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(arrayBuffer);
    
    // Check if the document has comments
    const commentsFile = zipContent.file("word/comments.xml");
    if (!commentsFile) {
      console.log("No comments found in document (no comments.xml file)");
      return [];
    }
    
    // Extract the comments XML content
    const commentsXml = await commentsFile.async("text");
    
    // Parse the XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(commentsXml, "text/xml");
    
    // Get all comment elements
    const commentElements = xmlDoc.getElementsByTagName("w:comment");
    console.log(`Found ${commentElements.length} comments in the document`);
    
    // Extract comment data
    const comments: WordComment[] = [];
    for (let i = 0; i < commentElements.length; i++) {
      const commentEl = commentElements[i];
      
      const id = commentEl.getAttribute("w:id") || `comment-${i}`;
      const author = commentEl.getAttribute("w:author") || "Unknown";
      const date = commentEl.getAttribute("w:date") || new Date().toISOString();
      
      // Extract the text content of the comment
      let text = "";
      const paragraphs = commentEl.getElementsByTagName("w:p");
      for (let j = 0; j < paragraphs.length; j++) {
        const textRuns = paragraphs[j].getElementsByTagName("w:t");
        for (let k = 0; k < textRuns.length; k++) {
          text += textRuns[k].textContent || "";
        }
        if (j < paragraphs.length - 1) {
          text += "\n";
        }
      }
      
      // In a real implementation, we would also extract the context reference
      // This is more complex as it requires parsing the document.xml to find where
      // the comment is referenced
      const contextReference = ""; // Placeholder
      
      comments.push({
        id,
        author,
        text,
        date,
        contextReference
      });
    }
    
    return comments;
  } catch (error) {
    console.error("Error extracting Word comments:", error);
    throw new Error(`Failed to extract comments from Word document: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Helper function to extract the document text for context
const extractDocumentText = async (file: File): Promise<string> => {
  console.log("Extracting document text for context");
  
  try {
    // Convert the File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Use mammoth.js to extract text
    const result = await mammoth.extractRawText({ arrayBuffer });
    console.log("Successfully extracted document text");
    
    return result.value;
  } catch (error) {
    console.error("Error extracting document text:", error);
    throw new Error(`Failed to extract text from Word document: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Helper function to find context for a comment
const findCommentContext = (documentText: string, commentId: string): string => {
  // In a real implementation, this would use the comment reference position
  // to extract the surrounding text
  
  // For now, we'll just provide a section of the document as context
  // In the future, this could be improved to find the actual context
  const lines = documentText.split('\n');
  const randomStartLine = Math.floor(Math.random() * Math.max(1, lines.length - 10));
  const contextLines = lines.slice(randomStartLine, randomStartLine + 10);
  return contextLines.join('\n');
};

// Helper function to extract comment context from Word document
const extractCommentContexts = async (file: File): Promise<Map<string, string>> => {
  console.log("Extracting comment contexts from document");
  
  try {
    // Read the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Use JSZip to extract document content
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(arrayBuffer);
    
    // Get document.xml which contains the main content
    const documentFile = zipContent.file("word/document.xml");
    if (!documentFile) {
      console.log("No document.xml found");
      return new Map();
    }
    
    // Extract document content
    const documentXml = await documentFile.async("text");
    
    // Get comments file to map IDs
    const commentsFile = zipContent.file("word/comments.xml");
    if (!commentsFile) {
      console.log("No comments.xml found");
      return new Map();
    }
    
    // Extract comments
    const commentsXml = await commentsFile.async("text");
    
    // Context map: commentId -> context text
    const contextMap = new Map<string, string>();
    
    // Find comment reference markers in the document
    // Comment ranges in Word are marked with <w:commentRangeStart w:id="1"/> and <w:commentRangeEnd w:id="1"/>
    const commentStartRegex = /<w:commentRangeStart\s+[^>]*w:id="(\d+)"[^>]*\/>/g;
    let match;
    
    while ((match = commentStartRegex.exec(documentXml)) !== null) {
      const commentId = match[1];
      const startPos = match.index;
      
      // Find corresponding end marker
      const endRegex = new RegExp(`<w:commentRangeEnd\\s+[^>]*w:id="${commentId}"[^>]*\\/>`, 'g');
      endRegex.lastIndex = startPos; // Start searching from the start marker
      
      const endMatch = endRegex.exec(documentXml);
      if (!endMatch) continue; // Skip if no end marker found
      
      const endPos = endMatch.index + endMatch[0].length;
      
      // Extract the XML content between markers
      const commentRange = documentXml.substring(startPos, endPos);
      
      // Extract text content from XML (this is simplified and would need to be more robust)
      let contextText = "";
      const textRegex = /<w:t[^>]*>(.*?)<\/w:t>/g;
      let textMatch;
      
      while ((textMatch = textRegex.exec(commentRange)) !== null) {
        contextText += textMatch[1] + " ";
      }
      
      // If we didn't find any text within the exact range, get surrounding paragraph
      if (contextText.trim().length === 0) {
        // Find the paragraph containing the comment marker
        const paragraphStart = documentXml.lastIndexOf("<w:p", startPos);
        const paragraphEnd = documentXml.indexOf("</w:p>", startPos) + 6;
        
        if (paragraphStart !== -1 && paragraphEnd !== -1) {
          const paragraphContent = documentXml.substring(paragraphStart, paragraphEnd);
          
          // Extract text from paragraph
          while ((textMatch = textRegex.exec(paragraphContent)) !== null) {
            contextText += textMatch[1] + " ";
          }
        }
      }
      
      // Clean up and store the context
      contextText = contextText.trim()
                             .replace(/\s+/g, " ")
                             .replace(/&lt;/g, "<")
                             .replace(/&gt;/g, ">")
                             .replace(/&amp;/g, "&")
                             .replace(/&quot;/g, "\"");
      
      // If the context is still empty or too short, add a note
      if (contextText.length < 10) {
        contextText = "[Could not extract specific context for this comment]";
      }
      
      // Store context with comment ID
      contextMap.set(commentId, contextText);
      console.log(`Extracted context for comment ${commentId}: ${contextText.substring(0, 50)}...`);
    }
    
    return contextMap;
  } catch (error) {
    console.error("Error extracting comment contexts:", error);
    return new Map();
  }
};

// Process document and extract comments
export const processDocument = async (file: File): Promise<Comment[]> => {
  try {
    console.log("Processing document:", file.name, "Type:", file.type);
    
    // Extract the document text for general context
    const documentText = await extractDocumentText(file);
    console.log("Successfully extracted document text, length:", documentText.length);
    
    // Extract comment-specific contexts
    const commentContexts = await extractCommentContexts(file);
    console.log(`Extracted ${commentContexts.size} comment contexts`);
    
    // Extract actual Word comments from the document
    const wordComments = await extractWordComments(file);
    console.log(`Extracted ${wordComments.length} Word comments`);
    
    // If no comments were found, display a message
    if (wordComments.length === 0) {
      console.log("No comments found in the document. Creating a sample comment for demonstration.");
      
      // Create a single sample comment for demonstration
      return [{
        id: "sample-comment",
        author: "System",
        text: "This document has no comments. Try uploading a document with comments, or add comments to this document and upload it again.",
        context: "No comments found in document",
        response: "This is a sample response. In a real scenario, this would be generated based on the comment.",
        date: new Date().toISOString()
      }];
    }
    
    // Convert Word comments to our application Comment format, with proper context
    const comments: Comment[] = wordComments.map(wordComment => {
      // Get the specific context for this comment, or use a section of the document text as fallback
      const specificContext = commentContexts.get(wordComment.id) || findCommentContext(documentText, wordComment.id);
      
      return {
        id: wordComment.id,
        author: wordComment.author,
        text: wordComment.text,
        context: specificContext,
        response: "", // Empty string, will be filled by OpenAI
        date: wordComment.date
      };
    });
    
    // Generate AI responses if API key is available
    const apiKey = openAIService.getApiKey();
    if (apiKey) {
      console.log("API key found, generating AI responses");
      const commentsWithResponses = await Promise.all(
        comments.map(async (comment, index) => {
          try {
            console.log(`Generating response for comment ${index + 1}/${comments.length} by ${comment.author}: "${comment.text.substring(0, 30)}..."`);
            const aiResponse = await openAIService.generateResponse(
              comment.text,
              comment.context
            );
            console.log(`Successfully generated response for comment ${index + 1}`);
            return { ...comment, response: aiResponse };
          } catch (error) {
            console.error(`Failed to generate response for comment ${comment.id}:`, error);
            return { ...comment, response: "Error generating response. Please try again." };
          }
        })
      );
      return commentsWithResponses;
    } else {
      console.warn("No OpenAI API key found. Returning comments without responses.");
      return comments;
    }
  } catch (error) {
    console.error("Error processing document:", error);
    throw new Error(`Failed to process document: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
  }
};

// Helper function to read file as text
const readFileAsText = async (file: File): Promise<string> => {
  console.log("Attempting to read file:", file.name);
  
  if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    console.log("Processing Word document with mammoth.js");
    
    try {
      // Convert the File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Use mammoth.js to extract text
      const result = await mammoth.extractRawText({ arrayBuffer });
      console.log("Successfully extracted text with mammoth.js");
      
      // Ensure we have a string
      if (typeof result.value !== 'string') {
        console.error("mammoth.js returned non-string content:", result.value);
        return String(result.value);
      }
      
      return result.value;
    } catch (error) {
      console.error("Error extracting text with mammoth.js:", error);
      throw new Error(`Failed to extract text from Word document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // For text files, keep the existing implementation
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

// Helper function to extract possible comments from text
const extractPossibleComments = (text: string): string[] => {
  // Add defensive check to ensure text is a string
  if (typeof text !== 'string') {
    console.error("extractPossibleComments received non-string input:", text);
    return [];
  }
  
  try {
    // In a real implementation, this would use NLP or pattern matching
    // to identify actual comments in the document
    
    // For now, we'll use a simple approach to look for sentences that might be comments
    // Looking for patterns like questions, suggestions, or critical statements
    const possibleCommentPatterns = [
      /\b(consider|suggest|recommend|propose|review|revise|update|clarify|explain|elaborate)\b/i,
      /\?([\s.!]|$)/,  // Questions ending with ?, ., !, or end of string
      /\b(unclear|confusing|vague|inconsistent|missing|needs|should|could|would|better)\b/i,
      /\b(add|remove|change|increase|decrease|improve|enhance)\b/i,
    ];
    
    console.log(`Splitting text for comments analysis. Text type: ${typeof text}. Text length: ${text.length}`);
    const sentences = text.split(/(?<=[.!?])\s+/);
    console.log(`Split text into ${sentences.length} sentences`);
    
    const possibleComments: string[] = [];
    
    for (const sentence of sentences) {
      if (sentence.length > 15) { // Ignore very short sentences
        for (const pattern of possibleCommentPatterns) {
          if (pattern.test(sentence)) {
            possibleComments.push(sentence.trim());
            break; // Once we match a pattern, no need to check others
          }
        }
      }
    }
    
    // Limit to a reasonable number of comments
    return possibleComments.slice(0, 5);
  } catch (error) {
    console.error("Error in extractPossibleComments:", error);
    console.error("Text that caused the error:", text);
    return [];
  }
};

// Helper function to extract sections from document text
const extractSections = (text: string): DocumentSection[] => {
  // Add defensive check to ensure text is a string
  if (typeof text !== 'string') {
    console.error("extractSections received non-string input:", text);
    return [{ heading: "Document", content: String(text) }];
  }
  
  try {
    // Split document into sections based on headings
  // In a real implementation, this would use more sophisticated parsing
    console.log(`Splitting text for sections extraction. Text type: ${typeof text}. Text length: ${text.length}`);
    const lines = text.split('\n');
    console.log(`Split text into ${lines.length} lines`);
    
    const sections: DocumentSection[] = [];
    
    let currentHeading = "Document";
    let currentContent = "";
    
    lines.forEach((line, index) => {
      try {
        if (typeof line !== 'string') {
          console.warn(`Line ${index} is not a string:`, line);
          line = String(line);
        }
        
        line = line.trim();
        
        // Check if the line is a heading (e.g., starts with # in markdown)
        // or is all caps, or ends with a colon, or is underlined
        const isHeading = /^#+\s/.test(line) || 
                         (line.toUpperCase() === line && line.length > 3) ||
                         /^[A-Z].*:$/.test(line) ||
                         /^[^\n]+\n[-=]+$/.test(line + '\n' + (lines[lines.indexOf(line) + 1] || ''));
        
        if (isHeading && line.length > 0) {
          // Save the previous section if there was content
          if (currentContent.trim().length > 0) {
            sections.push({
              heading: currentHeading,
              content: currentContent.trim()
            });
          }
          
          // Start a new section
          currentHeading = line.replace(/^#+\s/, '').replace(/:$/, '');
          currentContent = "";
        } else if (line.length > 0) {
          // Add to current content
          currentContent += line + '\n';
        }
      } catch (lineError) {
        console.error(`Error processing line ${index}:`, lineError);
      }
    });
    
    // Add the final section
    if (currentContent.trim().length > 0) {
      sections.push({
        heading: currentHeading,
        content: currentContent.trim()
      });
    }
    
    return sections;
  } catch (error) {
    console.error("Error in extractSections:", error);
    return [{ heading: "Document", content: String(text) }];
  }
};

// Helper function to get random author names (for demo purposes)
const getRandomAuthor = (): string => {
  const authors = [
    "Wei Chen", 
    "Maria Garcia",
    "John Smith",
    "Aisha Johnson",
    "Carlos Rodriguez"
  ];
  return authors[Math.floor(Math.random() * authors.length)];
};

// Interface for document sections
interface DocumentSection {
  heading: string;
  content: string;
}

// Helper function to generate comments from sections
const generateCommentsFromSections = (sections: DocumentSection[]): Comment[] => {
  console.log("Generating comments from sections:", sections.length);
  const comments: Comment[] = [];
  
  try {
    sections.forEach((section, index) => {
      console.log(`Processing section ${index + 1}: "${section.heading}"`);
      
      // Verify that section.content is a string
      if (typeof section.content !== 'string') {
        console.error(`Section ${index + 1} has non-string content:`, section.content);
        section.content = String(section.content);
      }
      
      // Look for patterns that might indicate comments in the text
      const possibleComments = extractPossibleComments(section.content);
      console.log(`Found ${possibleComments.length} possible comments in section ${index + 1}`);
      
      possibleComments.forEach((comment, commentIndex) => {
        comments.push({
          id: `comment-${index}-${commentIndex}`,
          author: getRandomAuthor(), // In production, would extract real authors
          text: comment,
          context: section.heading + "\n\n" + section.content.substring(0, 200) + "...",
          response: "", // Empty string, will be filled by OpenAI
          date: new Date().toISOString()
        });
      });
    });
    
    // If no comments were found, create a simulated one for testing
    if (comments.length === 0) {
      console.log("No comments detected. Adding simulated comments for testing purposes.");
      sections.forEach((section, index) => {
        if (index % 2 === 0 && section.heading) { // Add a comment to every other section that has a heading
          comments.push({
            id: `simulated-${index}`,
            author: getRandomAuthor(),
            text: `This ${section.heading.toLowerCase()} section needs more detail.`,
            context: section.heading + "\n\n" + section.content.substring(0, 200) + "...",
            response: "", // Empty string, will be filled by OpenAI
            date: new Date().toISOString()
          });
        }
      });
    }
    
    return comments;
  } catch (error) {
    console.error("Error in generateCommentsFromSections:", error);
    // Return at least one simulated comment even in case of error
    return [{
      id: "error-comment",
      author: "System",
      text: "There was an error processing comments in this document. Please check the console for details.",
      context: "Error processing document",
      response: "",
      date: new Date().toISOString()
    }];
  }
};

// Function to export document with responses added as replies to the original comments
export const exportDocumentWithResponses = async (comments: Comment[], originalFile: File): Promise<void> => {
  try {
    console.log("Exporting document with responses:", comments.length, "comments");
    
    // Read the original file as ArrayBuffer
    const arrayBuffer = await originalFile.arrayBuffer();
    
    // Use JSZip to extract and modify the document
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(arrayBuffer);
    
    // Check if the document has comments
    const commentsFile = zipContent.file("word/comments.xml");
    if (!commentsFile) {
      console.log("No comments.xml found, creating a new one");
      throw new Error("Cannot modify document: No comments found in original document");
    }
    
    // Extract the comments XML content
    let commentsXml = await commentsFile.async("text");
    console.log("Original comments XML:", commentsXml.substring(0, 200) + "...");
    
    // Make sure we have the right namespaces for replies
    if (!commentsXml.includes('xmlns:w15=')) {
      commentsXml = commentsXml.replace('<w:comments ', '<w:comments xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" ');
    }
    
    // We need to find the highest comment ID to start our reply IDs from there
    const idRegex = /w:id="(\d+)"/g;
    let highestId = 0;
    let match;
    
    while ((match = idRegex.exec(commentsXml)) !== null) {
      const id = parseInt(match[1], 10);
      if (id > highestId) {
        highestId = id;
      }
    }
    
    console.log(`Highest comment ID found: ${highestId}`);
    
    // Simplified direct approach: add responses directly in the comments without relying on commentsExtended
    for (const comment of comments) {
      if (comment.response) {
        const responseText = `\n<w:p>\n<w:pPr><w:pStyle w:val="CommentText"/></w:pPr>\n<w:r>\n<w:rPr><w:b/><w:color w:val="0000FF"/></w:rPr>\n<w:t>REPLY: </w:t>\n</w:r>\n<w:r>\n<w:rPr><w:color w:val="0000FF"/></w:rPr>\n<w:t>${comment.response.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}</w:t>\n</w:r>\n</w:p>`;
        
        // Find this specific comment by ID
        const commentRegex = new RegExp(`<w:comment[^>]*w:id="${comment.id}"[^>]*>[\\s\\S]*?</w:comment>`, 'g');
        
        // Replace the comment with itself plus the response paragraph
        commentsXml = commentsXml.replace(commentRegex, (match) => {
          // Insert the response paragraph before the closing comment tag
          return match.replace('</w:comment>', `${responseText}\n</w:comment>`);
        });
      }
    }
    
    console.log("Modified comments XML");
    
    // Update the comments.xml file
    zipContent.file("word/comments.xml", commentsXml);
    
    // Make sure the document has the necessary relationships and content types
    try {
      // Check and update [Content_Types].xml if needed
      const contentTypesFile = zipContent.file("[Content_Types].xml");
      if (contentTypesFile) {
        let contentTypesXml = await contentTypesFile.async("text");
        if (!contentTypesXml.includes('word/comments.xml')) {
          contentTypesXml = contentTypesXml.replace('</Types>', 
            `  <Override PartName="/word/comments.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml"/>\n</Types>`);
          zipContent.file("[Content_Types].xml", contentTypesXml);
        }
      }
      
      // Check relationships file
      const relsFile = zipContent.file("word/_rels/document.xml.rels");
      if (relsFile) {
        let relsXml = await relsFile.async("text");
        if (!relsXml.includes('Target="comments.xml"')) {
          // Find the highest relationship ID
          const relIdRegex = /Id="rId(\d+)"/g;
          let highestRelId = 0;
          let relMatch;
          
          while ((relMatch = relIdRegex.exec(relsXml)) !== null) {
            const relId = parseInt(relMatch[1], 10);
            if (relId > highestRelId) {
              highestRelId = relId;
            }
          }
          
          const newRelId = highestRelId + 1;
          
          relsXml = relsXml.replace('</Relationships>', 
            `  <Relationship Id="rId${newRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments" Target="comments.xml"/>\n</Relationships>`);
          zipContent.file("word/_rels/document.xml.rels", relsXml);
        }
      }
    } catch (error) {
      console.warn("Error updating content types or relationships:", error);
      // Continue anyway, as the main comments might still work
    }
    
    // Generate the modified DOCX file
    const modifiedDocBlob = await zipContent.generateAsync({ type: "blob" });
    
    // Get the filename without extension
    const originalName = originalFile.name.replace(/\.docx$/i, '');
    const newFileName = `${originalName}_with_responses.docx`;
    
    // Save the modified document
    saveAs(modifiedDocBlob, newFileName);
    
    console.log("Document exported successfully with responses");
  } catch (error) {
    console.error("Error exporting document with responses:", error);
    
    // Fallback: If modifying the original document fails, create a new document with comments and responses
    await createNewDocumentWithResponses(comments, originalFile);
  }
};

// Fallback function to create a new document with comments and responses
const createNewDocumentWithResponses = async (comments: Comment[], originalFile: File): Promise<void> => {
  try {
    console.log("Creating a new document with comments and responses");
    
    // Extract the text of the original document for context
    const documentText = await extractDocumentText(originalFile);
    
    // Create a new document with docx.js as a fallback
    import('docx').then(async ({ Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle }) => {
      // Create a new Word document
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: "Document Comments and Responses",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              children: [
                new TextRun(`Original Document: ${originalFile.name}`),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun(`Generated on: ${new Date().toLocaleString()}`),
              ],
            }),
            new Paragraph({}),
            
            // If we have document text, include a summary
            ...(documentText ? [
              new Paragraph({
                text: "Document Content Summary",
                heading: HeadingLevel.HEADING_2,
              }),
              new Paragraph({
                text: documentText.substring(0, 500) + (documentText.length > 500 ? "..." : ""),
              }),
              new Paragraph({}),
            ] : []),
            
            new Paragraph({
              text: "Comments and Responses",
              heading: HeadingLevel.HEADING_2,
            }),
            
            // Add each comment and response
            ...comments.flatMap((comment, index) => [
              new Paragraph({
                text: `Comment ${index + 1} by ${comment.author}`,
                heading: HeadingLevel.HEADING_3,
                spacing: {
                  before: 480,
                  after: 240,
                },
              }),
              new Paragraph({
                text: comment.text,
                spacing: {
                  after: 240,
                },
                border: {
                  left: {
                    style: BorderStyle.SINGLE,
                    size: 8,
                    color: "AAAAAA",
                    space: 12,
                  },
                  right: {
                    style: BorderStyle.NONE,
                  },
                  top: {
                    style: BorderStyle.NONE,
                  },
                  bottom: {
                    style: BorderStyle.NONE,
                  },
                },
                indent: {
                  left: 120,
                },
              }),
              new Paragraph({
                text: "Response:",
                spacing: {
                  before: 240,
                  after: 120,
                },
              }),
              new Paragraph({
                text: comment.response || "No response provided.",
                spacing: {
                  after: 240,
                },
                border: {
                  left: {
                    style: BorderStyle.SINGLE,
                    size: 8,
                    color: "5B9BD5",
                    space: 12,
                  },
                  right: {
                    style: BorderStyle.NONE,
                  },
                  top: {
                    style: BorderStyle.NONE,
                  },
                  bottom: {
                    style: BorderStyle.NONE,
                  },
                },
                indent: {
                  left: 120,
                },
              }),
              ...(comment.context ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Context:",
                      size: 20 // size in half-points (10pt = 20)
                    })
                  ],
                  spacing: {
                    before: 240,
                    after: 120,
                  },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: comment.context,
                      size: 20,
                      color: "666666"
                    })
                  ],
                  spacing: {
                    after: 480,
                  }
                }),
              ] : []),
              new Paragraph({
                border: {
                  bottom: {
                    style: BorderStyle.SINGLE,
                    size: 1,
                    color: "DDDDDD",
                  },
                },
              }),
            ]),
          ],
        }],
      });
      
      // Generate and save the document
      const blob = await Packer.toBlob(doc);
      const originalName = originalFile.name.replace(/\.docx$/i, '');
      saveAs(blob, `${originalName}_comments_responses.docx`);
      
      console.log("New document created successfully with comments and responses");
    });
  } catch (error) {
    console.error("Error creating new document:", error);
    throw new Error("Failed to export document");
  }
};

