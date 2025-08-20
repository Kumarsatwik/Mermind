import React from "react";
import { Sparkles } from "lucide-react";

export const ChatWelcome: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center text-center py-12">
      <div className="max-w-md space-y-4">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Welcome to AI Diagram Chat
          </h3>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Describe the diagram you want to create and I&apos;ll generate the
            Mermaid code for you. Try asking for flowcharts, sequence diagrams,
            class diagrams, and more!
          </p>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
          <p>
            <strong>Examples:</strong>
          </p>
          <p>&ldquo;Create a flowchart for user authentication&rdquo;</p>
          <p>&ldquo;Generate a sequence diagram for API calls&rdquo;</p>
          <p>&ldquo;Make a class diagram for an e-commerce system&rdquo;</p>
        </div>
      </div>
    </div>
  );
};
