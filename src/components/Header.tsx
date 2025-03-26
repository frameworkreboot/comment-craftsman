
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-xl mb-4">
          <span className="text-xs font-medium text-primary px-3 py-1">
            First Word Responder
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-medium tracking-tight">
          Automated Document <span className="text-primary">Comment Responses</span>
        </h1>
        <p className="mt-4 text-xl text-muted-foreground max-w-3xl">
          Upload your Word document with comments and get contextually appropriate response drafts that match your writing style.
        </p>
      </div>
    </header>
  );
};

export default Header;
