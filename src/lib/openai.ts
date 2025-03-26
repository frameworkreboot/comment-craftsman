import { toast } from "@/hooks/use-toast";

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
    index: number;
  }[];
}

export class OpenAIService {
  private apiKey: string | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    // Save to localStorage for convenience in this demo
    localStorage.setItem('openai_api_key', apiKey);
    return true;
  }

  getApiKey(): string | null {
    // Try to get from localStorage if not set in the instance
    if (!this.apiKey) {
      this.apiKey = localStorage.getItem('openai_api_key');
    }
    return this.apiKey;
  }

  async generateResponse(comment: string, documentContext: string): Promise<string> {
    if (!this.apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please enter your OpenAI API key in the settings first",
        variant: "destructive",
      });
      throw new Error("OpenAI API key not set");
    }

    try {
      console.log("Calling OpenAI API with comment:", comment.substring(0, 50) + "...");
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system", 
              content: "You are an assistant helping to draft responses to comments in a document. Provide concise, constructive responses that directly address the comment and relate to the specific text being commented on. Your responses should be professional, helpful, and show understanding of both the comment's intent and the document context."
            },
            {
              role: "user",
              content: `
Document excerpt that is being commented on:
"""
${documentContext}
"""

Comment by reviewer: "${comment}"

Please draft a response to this comment that:
1. Acknowledges the specific point raised in the comment
2. References relevant parts of the document text when appropriate
3. Provides a clear, professional reply that addresses the concern or suggestion
4. Is concise and to the point (typically 2-4 sentences)`
            }
          ],
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API error:", errorData);
        throw new Error(errorData.error?.message || "Failed to generate response");
      }

      const data = await response.json() as OpenAIResponse;
      console.log("OpenAI response received successfully");
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error("Error generating response:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate response",
        variant: "destructive",
      });
      throw error;
    }
  }
}

// Create a singleton instance
export const openAIService = new OpenAIService();
