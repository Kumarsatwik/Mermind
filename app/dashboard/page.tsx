"use client";
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Editor from "@/components/Editor";
import Preview from "@/components/Preview";
import AIPrompt from "@/components/AIPrompt";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { saveAs } from "file-saver";

const DEFAULT_DIAGRAM = `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action]
    B -->|No| D[Alternative Action]
    C --> E[Result]
    D --> E`;

const Dashboard = () => {
  const [code, setCode] = useState<string>(DEFAULT_DIAGRAM);
  const [prompt, setPrompt] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)

  // Initialize theme on component mount
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Re-render the diagram with the new theme
    // This forces the Mermaid renderer to use the new theme
    const currentCode = code;
    setCode("");
    setTimeout(() => setCode(currentCode), 10);
  };

  const handleExport = () => {
    try {
      const svgElement = document.querySelector(".diagram-container svg");
      if (!svgElement) {
        toast.error("Export failed", {
          description: "No diagram to export",
        });
        return;
      }

      // Get SVG content
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });

      // Generate filename from first line of diagram or use default
      let filename = "mermaid-diagram.svg";
      const firstLine = code.split("\n")[0];
      if (firstLine) {
        const cleanName = firstLine
          .replace(/[^\w\s]/gi, "")
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase();
        if (cleanName) {
          filename = `${cleanName}.svg`;
        }
      }

      saveAs(svgBlob, filename);

      toast.success(`Saved as ${filename}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export diagram");
    }
  };

  const handleDiagramGenerated = (generatedCode: string) => {
    setCode(generatedCode);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Header
        onExport={handleExport}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
      />

      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          {/* Editor Section */}
          <div className="glass-panel flex flex-col h-full min-h-0">
            <div className="flex-1 flex flex-col min-h-0 p-4">
              <Editor
                value={code}
                onChange={setCode}
                className="flex-1 min-h-0"
                promptValue={prompt}
                onPromptChange={setPrompt}
              />
              <Separator className="my-4" />
              <div className="flex-shrink-0">
                <AIPrompt
                  prompt={prompt}
                  onDiagramGenerated={handleDiagramGenerated}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="glass-panel flex flex-col h-full min-h-0">
            <div className="flex-1 p-4 min-h-0">
              <Preview code={code} className="h-full w-full" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="glass-panel p-4 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>
            Create beautiful diagrams with Mermaid syntax and AI assistance.
            Made with precision and care.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
