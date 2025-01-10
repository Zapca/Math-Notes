import { useState, useEffect, useRef } from 'react';
import { Pencil, Eraser, Undo, Redo, Save, Share2, Trash2, Grid, Calculator } from 'lucide-react';
import { HexColorPicker } from "react-colorful";

const DrawingCanvas = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen');
  const [ctx, setCtx] = useState(null);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [penSize, setPenSize] = useState(5);
  const [eraserSize, setEraserSize] = useState(20);
  const [penColor, setPenColor] = useState('#A6BDCB');
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [showGrid, setShowGrid] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isSolving, setIsSolving] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 60;
      context.strokeStyle = penColor;
      context.lineJoin = 'round';
      context.lineCap = 'round';
      context.lineWidth = tool === 'pen' ? penSize : eraserSize;
      if (showGrid) drawGrid(context);
    };

    setCanvasSize();
    setCtx(context);
    saveToUndoStack();

    window.addEventListener('resize', setCanvasSize);
    return () => window.removeEventListener('resize', setCanvasSize);
  }, []);

  useEffect(() => {
    if (ctx) {
      ctx.strokeStyle = tool === 'pen' ? penColor : '#ffffff';
      ctx.lineWidth = tool === 'pen' ? penSize : eraserSize;
    }
  }, [tool, penColor, penSize, eraserSize, ctx]);

  const drawGrid = (context) => {
    const canvas = canvasRef.current;
    const gridSize = 20;
    
    context.save();
    context.strokeStyle = '#ddd';
    context.lineWidth = 0.5;

    for (let x = 0; x <= canvas.width; x += gridSize) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, canvas.height);
      context.stroke();
    }

    for (let y = 0; y <= canvas.height; y += gridSize) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(canvas.width, y);
      context.stroke();
    }

    context.restore();
  };

  const saveToUndoStack = () => {
    const canvas = canvasRef.current;
    setUndoStack(prev => [...prev, canvas.toDataURL()]);
    setRedoStack([]); // Clear redo stack when new action is performed
  };

  const handleUndo = () => {
    if (undoStack.length > 1) {
      const prevState = undoStack[undoStack.length - 2];
      const img = new Image();
      img.src = prevState;
      img.onload = () => {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0);
        if (showGrid) drawGrid(ctx);
      };
      
      setRedoStack(prev => [...prev, undoStack[undoStack.length - 1]]);
      setUndoStack(prev => prev.slice(0, -1));
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      const img = new Image();
      img.src = nextState;
      img.onload = () => {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0);
        if (showGrid) drawGrid(ctx);
      };
      
      setUndoStack(prev => [...prev, nextState]);
      setRedoStack(prev => prev.slice(0, -1));
    }
  };

  const clearCanvas = () => {
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      if (showGrid) drawGrid(ctx);
      saveToUndoStack();
    }
  };

  const saveCanvas = () => {
    const link = document.createElement('a');
    link.download = 'math-notes.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const shareCanvas = () => {
    canvasRef.current.toBlob((blob) => {
      const file = new File([blob], 'math-notes.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        navigator.share({
          files: [file],
          title: 'Math Notes',
        });
      } else {
        saveCanvas();
      }
    });
  };

  const solveEquations = async () => {
    try {
      setIsSolving(true);
      const canvas = canvasRef.current;
      
      // Convert canvas to blob
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png');
      });
      
      const formData = new FormData();
      formData.append('image', blob);

      const response = await fetch('http://localhost:3001/api/solve', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.solutions && data.solutions.length > 0) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.font = '16px Arial';
        ctx.fillStyle = '#4CAF50';
        
        // Save current canvas state
        ctx.save();
        
        data.solutions.forEach((solution, index) => {
          const text = `= ${solution.result}`;
          ctx.fillText(
            text,
            canvas.width - 150,
            (index + 1) * 30
          );
        });
        
        // Restore canvas state
        ctx.restore();
        saveToUndoStack();
      } else {
        alert('No equations were detected. Please write more clearly or try again.');
      }
    } catch (error) {
      console.error('Error solving equations:', error);
      alert('Failed to solve equations. Please try again.');
    } finally {
      setIsSolving(false);
    }
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    
    setIsDrawing(true);
    setLastX(x);
    setLastY(y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    setLastX(x);
    setLastY(y);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToUndoStack();
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex justify-between p-4 bg-gray-100">
        {/* Left section - Undo/Redo */}
        <div className="flex gap-2">
          <button
            className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300"
            onClick={handleUndo}
            title="Undo"
          >
            <Undo className="w-6 h-6" />
          </button>
          <button
            className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300"
            onClick={handleRedo}
            title="Redo"
          >
            <Redo className="w-6 h-6" />
          </button>
        </div>

        {/* Center section - Tools */}
        <div className="flex gap-4">
          <button
            className={`p-2 rounded-lg ${tool === 'pen' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            onClick={() => setTool('pen')}
            title="Pen"
          >
            <Pencil className="w-6 h-6" />
          </button>
          <button
            className={`p-2 rounded-lg ${tool === 'eraser' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            onClick={() => setTool('eraser')}
            title="Eraser"
          >
            <Eraser className="w-6 h-6" />
          </button>
          <button
            className={`p-2 rounded-lg ${showGrid ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Grid"
          >
            <Grid className="w-6 h-6" />
          </button>
          <button
            className={`p-2 rounded-lg ${isSolving ? 'bg-gray-400' : 'bg-gray-200 hover:bg-gray-300'}`}
            onClick={solveEquations}
            disabled={isSolving}
            title="Solve Equations"
          >
            <Calculator className="w-6 h-6" />
          </button>
        </div>

        {/* Right section - Save/Share/Delete */}
        <div className="flex gap-2">
          <button
            className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300"
            onClick={saveCanvas}
            title="Save"
          >
            <Save className="w-6 h-6" />
          </button>
          <button
            className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300"
            onClick={shareCanvas}
            title="Share"
          >
            <Share2 className="w-6 h-6" />
          </button>
          <button
            className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300"
            onClick={clearCanvas}
            title="Clear"
          >
            <Trash2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Side controls */}
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-4 bg-white p-4 rounded-lg shadow-lg">
        <button
          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300"
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Color Picker"
          style={{ backgroundColor: penColor }}
        />
        {showColorPicker && (
          <div className="absolute top-12 left-0 z-10">
            <HexColorPicker color={penColor} onChange={setPenColor} />
          </div>
        )}
      </div>

      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-4 bg-white p-4 rounded-lg shadow-lg">
        {tool === 'pen' ? (
          <input
            type="range"
            min="1"
            max="20"
            value={penSize}
            onChange={(e) => setPenSize(parseInt(e.target.value))}
            className="h-32"
            style={{ writingMode: 'bt-lr', transform: 'rotate(270deg)' }}
            title="Pen Size"
          />
        ) : (
          <input
            type="range"
            min="10"
            max="50"
            value={eraserSize}
            onChange={(e) => setEraserSize(parseInt(e.target.value))}
            className="h-32"
            style={{ writingMode: 'bt-lr', transform: 'rotate(270deg)' }}
            title="Eraser Size"
          />
        )}
      </div>
      
      <canvas
        ref={canvasRef}
        className="flex-1 bg-white cursor-crosshair touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
    </div>
  );
};

export default DrawingCanvas;