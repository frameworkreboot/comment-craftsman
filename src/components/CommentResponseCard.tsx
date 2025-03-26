
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Check, Edit } from 'lucide-react';

export interface Comment {
  id: string;
  author: string;
  text: string;
  paragraph: string;
  response: string;
}

interface CommentResponseCardProps {
  comment: Comment;
  onResponseChange: (id: string, response: string) => void;
}

const CommentResponseCard: React.FC<CommentResponseCardProps> = ({ 
  comment, 
  onResponseChange 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [responseText, setResponseText] = useState(comment.response);

  const handleSave = () => {
    onResponseChange(comment.id, responseText);
    setIsEditing(false);
  };

  return (
    <Card className="overflow-hidden border backdrop-blur-sm bg-white/90 shadow-soft transition-all hover:shadow-md animate-slide-up">
      <CardContent className="p-6">
        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
          {/* Original comment */}
          <div className="space-y-2 py-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-xs font-medium">{comment.author.substring(0, 2).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm font-medium">{comment.author}</p>
                <p className="text-xs text-muted-foreground">Comment</p>
              </div>
            </div>
            <div className="rounded-lg bg-secondary p-4 text-sm">
              <p>{comment.text}</p>
            </div>
            <div className="text-xs text-muted-foreground italic">
              <p>Referring to: <span className="font-medium truncate">{comment.paragraph.substring(0, 100)}...</span></p>
            </div>
          </div>

          {/* Response */}
          <div className="space-y-2 py-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">You</span>
              </div>
              <div>
                <p className="text-sm font-medium">Your response</p>
                <p className="text-xs text-muted-foreground">Generated draft</p>
              </div>
            </div>
            
            {isEditing ? (
              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="min-h-[120px] focus-visible:ring-primary"
                placeholder="Edit your response..."
              />
            ) : (
              <div className="rounded-lg bg-primary/5 border border-primary/10 p-4 text-sm min-h-[120px]">
                <p>{responseText}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="px-6 py-4 bg-secondary/30 border-t flex justify-end">
        {isEditing ? (
          <Button onClick={handleSave} size="sm" className="gap-2">
            <Check className="h-4 w-4" />
            Save changes
          </Button>
        ) : (
          <Button 
            onClick={() => setIsEditing(true)} 
            variant="outline" 
            size="sm"
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit response
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default CommentResponseCard;
