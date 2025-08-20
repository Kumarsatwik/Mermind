import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import {
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Move,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { saveAs } from "file-saver";

interface PreviewProps {
  code: string;
  className?: string;
}

const Preview: React.FC<PreviewProps> = ({ code, className }) => {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [lastPanPoint, setLastPanPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize mermaid with custom config
    mermaid.initialize({
      startOnLoad: false,
      theme: document.documentElement.classList.contains("dark")
        ? "dark"
        : "default",
      securityLevel: "loose",
      fontFamily: "Inter, sans-serif",
    });
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!code.trim()) {
        setSvg("");
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Add a small delay to show loading state
        await new Promise((resolve) => setTimeout(resolve, 300));

        const { svg } = await mermaid.render("mermaid-diagram", code);
        setSvg(svg);
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to render diagram"
        );
        setSvg("");
      } finally {
        setLoading(false);
      }
    };

    renderDiagram();
  }, [code]);

  const handlePreviewOpen = () => {
    if (svg && !loading && !error) {
      setIsPreviewOpen(true);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.25));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleDownload = () => {
    if (svg) {
      const svgElement = previewContainerRef.current?.querySelector("svg");
      if (svgElement) {
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
      }
    }
  };

  // Panning functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && lastPanPoint && zoom > 1) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;

      setPan((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));

      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setLastPanPoint(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.25 : 0.25;
    const newZoom = Math.max(0.25, Math.min(5, zoom + delta));
    setZoom(newZoom);

    // Reset pan when zooming out to fit
    if (newZoom <= 1) {
      setPan({ x: 0, y: 0 });
    }
  };

  return (
    <>
      <div className={cn("h-full w-full overflow-auto", className)}>
        <div
          ref={containerRef}
          className="diagram-container min-h-full flex items-center justify-center relative"
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm animate-fade-in z-10">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
          )}

          {error && !loading && (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg animate-fade-in">
              <h3 className="text-red-600 dark:text-red-400 font-medium mb-2">
                Error
              </h3>
              <pre className="text-red-500 dark:text-red-300 text-sm whitespace-pre-wrap font-mono">
                {error}
              </pre>
            </div>
          )}

          {!loading && !error && svg ? (
            <div
              className="animate-scale-in w-full h-full flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
              dangerouslySetInnerHTML={{ __html: svg }}
              onClick={handlePreviewOpen}
              title="Click to view in full screen"
            />
          ) : (
            !loading &&
            !error && (
              <div className="text-center text-slate-400 dark:text-slate-500 animate-fade-in">
                <p>Your diagram will appear here</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Full Screen Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 flex flex-col">
          {/* Header */}
          <DialogHeader className="p-4 border-b h-fit bg-background">
            <div className="flex items-center justify-evenly flex-wrap gap-4">
              <DialogTitle className="text-lg font-semibold">
                Diagram Preview
              </DialogTitle>

              {/* Zoom & Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.25}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-mono min-w-[60px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 5}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleResetZoom}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          <div
            className="flex-1 overflow-hidden bg-muted relative"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{
              cursor: isPanning ? "grabbing" : zoom > 1 ? "grab" : "default",
            }}
          >
            <div
              ref={previewContainerRef}
              className="w-full h-full flex items-center justify-center"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "center center",
                transition: isPanning ? "none" : "transform 0.2s ease-in-out",
              }}
            >
              <div
                className="max-w-full max-h-full"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </div>

            {/* Zoom indicator */}
            {zoom > 1 && (
              <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <Move className="h-4 w-4" />
                  <span>Drag to pan</span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Preview;
