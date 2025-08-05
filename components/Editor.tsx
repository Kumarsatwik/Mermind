import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Chat from "@/components/Chat";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  onDiagramGenerated: (diagram: string) => void;
}

const Editor: React.FC<EditorProps> = ({
  value,
  onChange,
  className,
  onDiagramGenerated,
}) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      // Auto-resize textarea
      editorRef.current.style.height = "auto";
      editorRef.current.style.height = `${editorRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + "  " + value.substring(end);
      onChange(newValue);

      // Set cursor position after tab
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.selectionStart = editorRef.current.selectionEnd =
            start + 2;
        }
      }, 0);
    }
  };

  return (
    <div className={cn("h-full flex flex-col min-h-0", className)}>
      <Tabs defaultValue="code" className="h-full flex flex-col min-h-0">
        <TabsList className="w-full justify-start bg-transparent border-b border-slate-200/80 dark:border-slate-800/80 rounded-none px-0 flex-shrink-0">
          <TabsTrigger
            value="code"
            className="rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-sm font-medium"
          >
            Mermaid Code
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-sm font-medium"
          >
            AI Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="code" className="flex-1 mt-0 min-h-0">
          <div className="h-full min-h-0">
            <textarea
              ref={editorRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your mermaid code here..."
              className="w-full h-full resize-none font-mono editor-textarea p-4 bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              spellCheck="false"
              style={{
                fontSize: "clamp(13px, 1vw, 16px)",
                lineHeight: "1.6",
                fontFamily:
                  'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="chat" className="flex-1 mt-0 min-h-0">
          <Chat onDiagramGenerated={onDiagramGenerated} className="h-full" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Editor;
