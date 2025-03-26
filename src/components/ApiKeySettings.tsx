
import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { openAIService } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";

interface ApiKeySettingsProps {
  onKeySaved?: () => void;
}

const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({ onKeySaved }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if key exists in localStorage
    const savedKey = openAIService.getApiKey();
    setHasKey(!!savedKey);
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Invalid API key",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }

    try {
      openAIService.setApiKey(apiKey.trim());
      setIsOpen(false);
      setHasKey(true);
      
      toast({
        title: "API Key Saved",
        description: "Your OpenAI API key has been saved",
      });
      
      if (onKeySaved) {
        onKeySaved();
      }
    } catch (error) {
      toast({
        title: "Error Saving Key",
        description: "There was an error saving your API key",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full">
      {!isOpen ? (
        <Button 
          variant={hasKey ? "outline" : "default"} 
          className="gap-2"
          onClick={() => setIsOpen(true)}
        >
          <Settings size={16} />
          {hasKey ? "Change API Key" : "Set OpenAI API Key"}
        </Button>
      ) : (
        <div className="p-4 border rounded-lg bg-white/50 backdrop-blur-sm shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">OpenAI API Key</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label htmlFor="api-key">Enter your OpenAI API key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Your API key is stored locally in your browser and never sent to our servers.
            </p>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={handleSave}>Save Key</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeySettings;
