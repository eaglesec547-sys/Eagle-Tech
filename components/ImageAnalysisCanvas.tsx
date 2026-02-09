
import React, { useRef, useEffect } from 'react';
import { Detection, Severity, RoadDefectType } from '../types';

interface ImageAnalysisCanvasProps {
  imageData: string;
  detections: Detection[];
  selectedDetectionId: string | null;
  onDetectionClick?: (id: string) => void;
}

const getDefectColor = (type: RoadDefectType) => {
  if (type.includes('Crack')) return '#3b82f6'; // Blue
  if (type === RoadDefectType.POTHOLE) return '#ef4444'; // Red
  if (type === RoadDefectType.RUTTING) return '#f97316'; // Orange
  if (type === RoadDefectType.BLEEDING) return '#a855f7'; // Purple
  if (type === RoadDefectType.PATCHING) return '#10b981'; // Green
  return '#eab308'; // Yellow for others
};

const ImageAnalysisCanvas: React.FC<ImageAnalysisCanvasProps> = ({ 
  imageData, 
  detections, 
  selectedDetectionId,
  onDetectionClick 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const draw = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.src = imageData;
      img.onload = () => {
        const containerWidth = containerRef.current!.clientWidth;
        const scale = containerWidth / img.width;
        const canvasWidth = containerWidth;
        const canvasHeight = img.height * scale;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Draw Base Image
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

        // Draw All Detections
        detections.forEach((det) => {
          const isSelected = selectedDetectionId === det.id;
          const color = getDefectColor(det.type);
          const opacity = isSelected ? '88' : '33';
          
          const { x, y, w, h } = det.coordinates;
          const scaledX = (x / 100) * canvasWidth;
          const scaledY = (y / 100) * canvasHeight;
          const scaledW = (w / 100) * canvasWidth;
          const scaledH = (h / 100) * canvasHeight;

          // Draw Polygon if available
          if (det.polygonPoints && det.polygonPoints.length > 2) {
            ctx.beginPath();
            ctx.moveTo(
              (det.polygonPoints[0].x / 100) * canvasWidth,
              (det.polygonPoints[0].y / 100) * canvasHeight
            );
            det.polygonPoints.slice(1).forEach(p => {
              ctx.lineTo((p.x / 100) * canvasWidth, (p.y / 100) * canvasHeight);
            });
            ctx.closePath();
            
            ctx.fillStyle = `${color}${opacity}`;
            ctx.fill();
            
            ctx.strokeStyle = color;
            ctx.lineWidth = isSelected ? 4 : 2;
            ctx.stroke();
          } else {
            // Fallback to bounding box
            ctx.strokeStyle = color;
            ctx.lineWidth = isSelected ? 4 : 2;
            ctx.strokeRect(scaledX, scaledY, scaledW, scaledH);
            
            ctx.fillStyle = `${color}${opacity}`;
            ctx.fillRect(scaledX, scaledY, scaledW, scaledH);
          }

          // Label
          if (isSelected) {
            ctx.fillStyle = color;
            const labelText = `${det.type} [${(det.confidence * 100).toFixed(0)}%]`;
            ctx.font = 'bold 12px JetBrains Mono, monospace';
            const metrics = ctx.measureText(labelText);
            
            ctx.fillRect(scaledX, scaledY - 22 < 0 ? scaledY : scaledY - 22, metrics.width + 10, 22);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(labelText, scaledX + 5, scaledY - 22 < 0 ? scaledY + 16 : scaledY - 7);
            
            // Highlight Pulse
            ctx.shadowBlur = 15;
            ctx.shadowColor = color;
          }
        });
      };
    };

    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [imageData, detections, selectedDetectionId]);

  return (
    <div ref={containerRef} className="relative w-full rounded-xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-800 group cursor-crosshair">
      <canvas 
        ref={canvasRef} 
        className="block w-full h-auto" 
        onClick={(e) => {
          if (!canvasRef.current || !onDetectionClick) return;
          const rect = canvasRef.current.getBoundingClientRect();
          const clickX = ((e.clientX - rect.left) / rect.width) * 100;
          const clickY = ((e.clientY - rect.top) / rect.height) * 100;

          // Find if we clicked within a detection box
          const found = detections.find(d => 
            clickX >= d.coordinates.x && clickX <= d.coordinates.x + d.coordinates.w &&
            clickY >= d.coordinates.y && clickY <= d.coordinates.y + d.coordinates.h
          );
          if (found) onDetectionClick(found.id);
        }}
      />
      {detections.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 pointer-events-none">
           <span className="text-slate-400 italic text-sm tracking-widest animate-pulse">RENDERING ANNOTATIONS...</span>
        </div>
      )}
      <div className="absolute top-4 left-4 flex gap-2 pointer-events-none">
        <span className="bg-black/60 backdrop-blur px-2 py-1 rounded text-[9px] font-bold border border-white/10 uppercase tracking-tighter">
          LAYER: INFRA_ANALYTICS_V4
        </span>
      </div>
    </div>
  );
};

export default ImageAnalysisCanvas;
