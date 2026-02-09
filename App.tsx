
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import ImageAnalysisCanvas from './components/ImageAnalysisCanvas';
import { analyzeRoadImage } from './services/geminiService';
import { AnalysisReport, Severity } from './types';

const App: React.FC = () => {
  const [history, setHistory] = useState<AnalysisReport[]>([]);
  const [currentReport, setCurrentReport] = useState<AnalysisReport | null>(null);
  const [selectedDetectionId, setSelectedDetectionId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [processingQueue, setProcessingQueue] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('eagle-tech-history-v3');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('eagle-tech-history-v3', JSON.stringify(history));
  }, [history]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setError(null);
    setIsAnalyzing(true);
    setProcessingQueue(files.length);
    setCurrentReport(null);
    setSelectedDetectionId(null);

    const processFile = (file: File): Promise<AnalysisReport> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = e.target?.result as string;
          try {
            const rawResult = await analyzeRoadImage(base64, file.name);
            const report: AnalysisReport = {
              ...rawResult,
              id: Math.random().toString(36).substr(2, 9),
              timestamp: Date.now(),
              imageName: file.name,
              imageData: base64,
            };
            resolve(report);
          } catch (err) { reject(err); }
        };
        reader.onerror = () => reject(new Error("File read error"));
        reader.readAsDataURL(file);
      });
    };

    try {
      const results: AnalysisReport[] = [];
      for (let i = 0; i < files.length; i++) {
        setProcessingQueue(files.length - i);
        const report = await processFile(files[i]);
        results.push(report);
      }
      setHistory(prev => [...results, ...prev]);
      setCurrentReport(results[0]);
    } catch (err: any) {
      setError(err.message || 'Inspection failed.');
    } finally {
      setIsAnalyzing(false);
      setProcessingQueue(0);
    }
  };

  const getSeverityBadgeClass = (severity: Severity) => {
    switch (severity) {
      case Severity.CRITICAL: return 'bg-red-500/10 text-red-500 border-red-500/20';
      case Severity.HIGH: return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case Severity.MEDIUM: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case Severity.LOW: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Telemetry Logs</h2>
          <span className="text-[9px] bg-blue-600/10 text-blue-500 px-1.5 py-0.5 rounded border border-blue-500/20 font-bold">{history.length}</span>
        </div>
        <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
          {history.length === 0 ? (
            <div className="text-[11px] text-slate-600 px-4 py-12 text-center border border-dashed border-slate-800 rounded-2xl font-medium">
              No active inspection data. Upload imagery to begin.
            </div>
          ) : (
            history.map((report) => (
              <button
                key={report.id}
                onClick={() => {
                  setCurrentReport(report);
                  setSelectedDetectionId(null);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all duration-300 group ${
                  currentReport?.id === report.id
                    ? 'bg-blue-600/10 border-blue-500/50 text-blue-100 ring-1 ring-blue-500/20'
                    : 'bg-slate-800/20 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black truncate max-w-[140px] uppercase tracking-tight">{report.imageName}</span>
                  <div className={`w-2 h-2 rounded-full ${report.overallSeverityIndex === Severity.CRITICAL ? 'bg-red-500 animate-pulse' : 'bg-slate-700'}`}></div>
                </div>
                <div className="flex items-center justify-between">
                   <div className="text-[9px] text-slate-500 mono">{new Date(report.timestamp).toLocaleDateString()}</div>
                   <div className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase ${getSeverityBadgeClass(report.overallSeverityIndex)}`}>
                    {report.overallSeverityIndex}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
      
      <div className="mt-auto p-4 border-t border-slate-800 space-y-3">
        <label className="flex items-center justify-center gap-3 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-blue-900/20">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          New Scan Session
          <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
        </label>
        <button
          onClick={() => { setHistory([]); setCurrentReport(null); }}
          className="w-full text-[10px] text-slate-600 hover:text-red-400 font-bold uppercase tracking-widest transition-colors py-2"
        >
          Purge Global History
        </button>
      </div>
    </div>
  );

  return (
    <Layout sidebar={sidebar}>
      <div className="max-w-7xl mx-auto">
        
        {!currentReport && !isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-40 px-6 text-center">
            <div className="relative mb-12">
               <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
               <div className="relative w-32 h-32 bg-slate-900 border border-blue-500/30 rounded-3xl flex items-center justify-center shadow-2xl">
                  <svg className="w-16 h-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
               </div>
            </div>
            <h2 className="text-5xl font-black text-white mb-6 tracking-tighter uppercase italic">Engineering Analysis Terminal</h2>
            <p className="text-slate-500 max-w-2xl mb-12 text-lg font-medium leading-relaxed">
              Precision road surface inspection system. Deploy batch neural processing to classify cracks, potholes, and structural degradation with spatial accuracy.
            </p>
            <label className="cursor-pointer group relative flex items-center gap-4 px-12 py-6 bg-white text-slate-950 rounded-2xl font-black text-xl transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-white/5">
              INITIATE UPLOAD
              <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
              <svg className="w-6 h-6 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </label>
            {error && <div className="mt-12 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 font-mono text-sm max-w-md">{error}</div>}
          </div>
        )}

        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-48 space-y-10">
            <div className="relative">
              <div className="w-40 h-40 border-t-4 border-r-4 border-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-4xl font-black text-white">{processingQueue}</span>
                <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">PENDING</span>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-3xl font-black text-white mb-3 italic">NEURAL_PASS_ACTIVE</h3>
              <p className="text-slate-500 mono text-xs tracking-[0.4em] uppercase animate-pulse">
                DECRYPTING_PIXEL_GEOMETRY // CLASSIFYING_ANOMALIES
              </p>
            </div>
          </div>
        )}

        {currentReport && !isAnalyzing && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            {/* Viewport Layer */}
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-1.5 shadow-2xl overflow-hidden relative">
                 <ImageAnalysisCanvas 
                    imageData={currentReport.imageData} 
                    detections={currentReport.detections} 
                    selectedDetectionId={selectedDetectionId}
                    onDetectionClick={setSelectedDetectionId}
                 />
              </div>

              {/* Data Grid */}
              <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2rem] overflow-hidden backdrop-blur-xl">
                 <div className="px-10 py-6 border-b border-slate-800/50 flex items-center justify-between bg-slate-800/10">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Precision Telemetry</h3>
                    <div className="text-[10px] text-slate-500 font-bold uppercase flex gap-4">
                       <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Cracks</span>
                       <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Potholes</span>
                       <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div> Rutting</span>
                    </div>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-800/20 text-slate-500 font-black uppercase tracking-widest text-[10px]">
                          <th className="px-10 py-5">Class Identifier</th>
                          <th className="px-10 py-5">Impact</th>
                          <th className="px-10 py-5 text-right">Confidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {currentReport.detections.map((det) => (
                          <tr 
                            key={det.id} 
                            onClick={() => setSelectedDetectionId(det.id)}
                            className={`cursor-pointer transition-all duration-300 ${
                              selectedDetectionId === det.id ? 'bg-blue-600/10' : 'hover:bg-slate-800/20'
                            }`}
                          >
                            <td className="px-10 py-6">
                               <div className="flex items-center gap-4">
                                  <div className={`w-1 h-8 rounded-full ${selectedDetectionId === det.id ? 'bg-blue-500' : 'bg-slate-800'}`}></div>
                                  <div>
                                     <div className={`font-black uppercase tracking-tight ${selectedDetectionId === det.id ? 'text-blue-400' : 'text-slate-200'}`}>
                                        {det.type}
                                     </div>
                                     <div className="text-[10px] text-slate-500 mono mt-0.5">{det.dimensions}</div>
                                  </div>
                               </div>
                            </td>
                            <td className="px-10 py-6">
                              <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase border tracking-widest ${getSeverityBadgeClass(det.severity)}`}>
                                {det.severity}
                              </span>
                            </td>
                            <td className="px-10 py-6 text-right font-black mono text-xs text-blue-500">
                               {(det.confidence * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
              </div>
            </div>

            {/* Analysis Sidebar */}
            <div className="lg:col-span-4 space-y-8">
               <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-10 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                     <svg className="w-32 h-32 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 19h20L12 2zm0 3.3l7.4 12.7H4.6L12 5.3zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" /></svg>
                  </div>
                  <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.4em] mb-10">Diagnostic Intel</h3>
                  
                  <div className="space-y-8">
                     <div className="flex items-center justify-between">
                        <div>
                           <div className="text-[10px] text-slate-500 font-black uppercase mb-1">Impact Level</div>
                           <div className="text-3xl font-black text-white italic tracking-tighter uppercase">{currentReport.overallSeverityIndex}</div>
                        </div>
                        <div className="text-right">
                           <div className="text-[10px] text-slate-500 font-black uppercase mb-1">Issue Count</div>
                           <div className="text-3xl font-black text-white italic">{currentReport.totalDetections}</div>
                        </div>
                     </div>

                     <div className="pt-8 border-t border-slate-800">
                        <div className="flex justify-between items-end mb-3">
                           <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Repair Priority</span>
                           <span className="text-2xl font-black text-blue-500">{currentReport.maintenancePriority}<span className="text-slate-700 text-lg">/5</span></span>
                        </div>
                        <div className="flex gap-2 h-4">
                           {[1, 2, 3, 4, 5].map((level) => (
                              <div key={level} className={`flex-1 rounded-md transition-all duration-500 ${level <= currentReport.maintenancePriority ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-800'}`}></div>
                           ))}
                        </div>
                     </div>

                     <div className="p-8 bg-blue-600 rounded-3xl shadow-2xl shadow-blue-900/40 transform transition-transform hover:scale-[1.02]">
                        <div className="text-[10px] font-black text-white/60 mb-4 uppercase tracking-[0.2em]">Maintenance Protocol</div>
                        <p className="text-white text-base leading-relaxed font-bold italic tracking-tight">
                          "{currentReport.suggestedAction}"
                        </p>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-4 gap-4">
                  <button 
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(currentReport, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `eagle-report-${currentReport.id}.json`;
                      a.click();
                    }}
                    className="col-span-3 bg-slate-900 hover:bg-slate-800 text-white py-6 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all border border-slate-800 flex items-center justify-center gap-3 shadow-xl"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Export GIS JSON
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-[1.5rem] flex items-center justify-center border border-slate-800 shadow-xl"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
