
import { Comment } from '@/components/CommentResponseCard';

// Simulate document processing
export const processDocument = (file: File): Promise<Comment[]> => {
  return new Promise((resolve) => {
    // Simulate processing time
    setTimeout(() => {
      // Mock comments for demonstration
      const mockComments: Comment[] = [
        {
          id: "comment1",
          author: "John Smith",
          text: "This paragraph needs more clarity. What do you mean by 'innovative approach'?",
          paragraph: "Our team has developed an innovative approach to solving this problem, combining traditional methods with cutting-edge technology.",
          response: "By 'innovative approach', I'm referring to our unique combination of established methodologies with recent technological advances. Specifically, we've integrated machine learning algorithms with traditional statistical analysis to identify patterns that wouldn't be visible through either method alone."
        },
        {
          id: "comment2",
          author: "Sarah Johnson",
          text: "Can you provide supporting evidence for this claim?",
          paragraph: "Studies show that this method increases productivity by over 40% in most cases.",
          response: "I'll add citations to the Henderson (2021) and Miller et al. (2022) studies, which demonstrated productivity improvements of 42% and 38% respectively across diverse industry settings. Both studies used control groups and statistically significant sample sizes."
        },
        {
          id: "comment3",
          author: "Michael Wong",
          text: "This section would benefit from a real-world example.",
          paragraph: "The application of these principles can transform organizational outcomes.",
          response: "I'll incorporate the case study of Acme Corporation, which implemented these principles in 2022 and saw a 27% reduction in overhead costs while improving customer satisfaction scores by 15 points. This example illustrates how these abstract principles translate to measurable business outcomes."
        },
        {
          id: "comment4",
          author: "Jennifer Davis",
          text: "Consider rephrasing for a less technical audience.",
          paragraph: "The algorithm's heuristic optimization leverages stochastic gradient descent to minimize error propagation through the network.",
          response: "I'll simplify this to: 'Our approach uses an advanced learning method that gradually improves accuracy by making small adjustments based on each new piece of information it processes.' This maintains the core concept while making it accessible to non-technical readers."
        },
        {
          id: "comment5",
          author: "Robert Chen",
          text: "Check for consistency with the previous section's terminology.",
          paragraph: "The framework consists of three primary components that work in tandem to achieve the desired outcome.",
          response: "You're right - I'll revise this to use 'elements' rather than 'components' to maintain consistency with the terminology established in Section 2.3. I'll also ensure the names of the three elements match exactly with their earlier descriptions."
        }
      ];

      resolve(mockComments);
    }, 3000); // Simulate 3 second processing time
  });
};

// Simulate exporting the document with responses
export const exportDocumentWithResponses = (comments: Comment[]): Promise<string> => {
  return new Promise((resolve) => {
    // Simulate export processing time
    setTimeout(() => {
      // In a real application, this would generate a .docx file
      // For demo purposes, we're just returning a mock download URL
      resolve("processed-document.docx");
    }, 1500);
  });
};
