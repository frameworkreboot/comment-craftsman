
import { Comment } from "@/components/CommentResponseCard";
import { openAIService } from "./openai";

// Simulate document analysis and comment extraction
export const processDocument = async (file: File): Promise<Comment[]> => {
  // This is a mock implementation
  // In a real app, this would extract actual comments from the document
  
  const mockComments: Comment[] = [
    {
      id: "comment-1",
      author: "John Doe",
      date: new Date(Date.now() - 86400000).toISOString(),
      text: "This section could use more clarity. Can you expand on the key concepts?",
      context: "Introduction to the methodology section that explains the approach taken for data analysis.",
      response: ""
    },
    {
      id: "comment-2",
      author: "Jane Smith",
      date: new Date(Date.now() - 172800000).toISOString(),
      text: "Consider adding a figure here to illustrate this process.",
      context: "Description of a complex multi-step process that would benefit from visual representation.",
      response: ""
    },
    {
      id: "comment-3",
      author: "Alex Johnson",
      date: new Date(Date.now() - 259200000).toISOString(),
      text: "This conclusion seems too strong given the limitations discussed earlier.",
      context: "Conclusion section that makes claims about the generalizability of the findings.",
      response: ""
    }
  ];

  // Generate AI responses if API key is available
  try {
    if (openAIService.getApiKey()) {
      const commentsWithResponses = await Promise.all(
        mockComments.map(async (comment) => {
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
  } catch (error) {
    console.error("Error generating AI responses:", error);
  }

  // If no API key or generation failed, return mock responses
  return mockComments.map(comment => ({
    ...comment,
    response: `This is a sample response to the comment: "${comment.text.substring(0, 30)}...". Please set an OpenAI API key to generate real responses.`
  }));
};

// Simulate document export with responses
export const exportDocumentWithResponses = async (comments: Comment[]): Promise<string> => {
  // This is a mock implementation
  // In a real app, this would create a new document with the responses
  console.log("Exporting document with responses:", comments);
  
  // Simulate a download URL
  return "processed-document.docx";
};
