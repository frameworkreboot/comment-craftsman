
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
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system", 
              content: "You are an assistant helping to draft responses to comments in a document. Provide concise, constructive responses that address the comment directly."
            },
            {
              role: "user",
              content: `Document context: ${documentContext}\n\nComment: ${comment}\n\nPlease draft a response to this comment that is professional, helpful, and addresses the comment directly.`
            }
          ],
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to generate response");
      }

      const data = await response.json() as OpenAIResponse;
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
