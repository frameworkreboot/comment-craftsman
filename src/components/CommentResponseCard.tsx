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
  context: string;
  response: string;
  date?: string; // Making date optional to match usage in docProcess.ts
}

interface CommentResponseCardProps {
  comment: Comment;
  onResponseChange: (id: string, newResponse: string) => void;
}

const CommentResponseCard: React.FC<CommentResponseCardProps> = ({ 
  comment, 
  onResponseChange 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedResponse, setEditedResponse] = useState(comment.response);
  
  const handleEditToggle = () => {
    if (isEditing) {
      onResponseChange(comment.id, editedResponse);
    }
    setIsEditing(!isEditing);
  };
  
  return (
    <Card className="mb-6 overflow-hidden">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Comment section */}
          <div className="p-6 bg-muted/30 flex flex-col">
            <div className="flex items-center mb-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium mr-3">
                {comment.author.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-medium">{comment.author}</div>
                <div className="text-xs text-muted-foreground">Comment</div>
              </div>
            </div>
            
            <div className="mt-2 mb-4 text-left">
              {comment.text}
            </div>
            
            {/* Add a fixed height container with scrolling for the reference text */}
            <div className="mt-auto pt-4 text-xs text-muted-foreground border-t border-border/50 text-left">
              {comment.context && (
                <div>
                  <div>Referring to:</div>
                  <div className="italic truncate">{comment.context}</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Response section - now shown as a reply */}
          <div className="p-6 flex flex-col">
            <div className="flex items-center mb-2">
              <div className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-medium mr-3">
                AI
              </div>
              <div>
                <div className="font-medium">Reply</div>
                <div className="text-xs text-muted-foreground">Generated draft</div>
              </div>
            </div>
            
            {isEditing ? (
              <Textarea
                value={editedResponse}
                onChange={(e) => setEditedResponse(e.target.value)}
                className="mt-2 min-h-[150px] text-left"
                placeholder="Edit your reply..."
              />
            ) : (
              <div className="mt-2 text-left">
                {comment.response}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="justify-end p-4 pt-0 border-t">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleEditToggle}
          className="flex items-center gap-1"
        >
          {isEditing ? (
            <>
              <Check className="h-4 w-4" /> Save reply
            </>
          ) : (
            <>
              <Edit className="h-4 w-4" /> Edit reply
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CommentResponseCard;
