
import React, { useState } from 'react';
import { Upload, RefreshCw, FileText, Sparkles, Copy, CheckCircle, File as FileIcon, X, Download, Search, Globe, Type as TypeIcon, Settings2 } from 'lucide-react';
import { processDocument } from './services/geminiService';
import { ProcessingState, ProcessingResult } from './types';

const LANGUAGES = [
  { label: 'Tiếng Việt', value: 'Vietnamese' },
  { label: 'Tiếng Anh', value: 'English' },
  { label: 'Tiếng Pháp', value: 'French' },
  { label: 'Tiếng Trung Quốc', value: 'Chinese' },
  { label: 'Tiếng Nhật Bản', value: 'Japanese' },
];

const REFINEMENT_STYLES = [
  { label: 'Chuyên nghiệp', value: 'professional', description: 'Thể hiện lịch sự, rõ ràng, tập trung giải pháp, tuân thủ quy tắc' },
  { label: 'Tình cảm', value: 'emotional', description: 'Thể hiện sự thấu cảm, nhẹ nhàng, tạo kết nối cảm xúc' },
  { label: 'Trực tiếp/Quyết đoán', value: 'direct', description: 'ngắn gọn, đưa giải pháp' },
  { label: 'Ẩn ý/Ngụ ý', value: 'implicit', description: 'dùng câu chuyện để khuyên răn' },
  { label: 'Hài hước', value: 'humorous', description: 'Tạo không khí vui vẻ' },
];

const App: React.FC = () => {
  const [fileData, setFileData] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [state, setState] = useState<ProcessingState>(ProcessingState.IDLE);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Language & Refinement states
  const [inputLang, setInputLang] = useState<string>(LANGUAGES[0].value);
  const [outputLang, setOutputLang] = useState<string>(LANGUAGES[0].value);
  const [refineMode, setRefineMode] = useState<'none' | 'style'>('style');
  const [selectedStyle, setSelectedStyle] = useState<string>(REFINEMENT_STYLES[0].value);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileData({
          base64: reader.result as string,
          mimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
          name: file.name
        });
        setResult(null);
        setError(null);
        setSearchTerm('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!fileData) return;

    setState(ProcessingState.PROCESSING);
    setError(null);

    try {
      const inputLangLabel = LANGUAGES.find(l => l.value === inputLang)?.label || inputLang;
      const outputLangLabel = LANGUAGES.find(l => l.value === outputLang)?.label || outputLang;
      
      let styleDesc = null;
      if (refineMode === 'style') {
        const style = REFINEMENT_STYLES.find(s => s.value === selectedStyle);
        styleDesc = `${style?.label}: ${style?.description}`;
      }

      const jsonResponse = await processDocument(
        fileData.base64, 
        fileData.mimeType, 
        inputLangLabel, 
        outputLangLabel,
        styleDesc
      );
      
      const parsed: any = JSON.parse(jsonResponse);
      setResult({
        originalText: parsed.originalText,
        rewrittenText: parsed.rewrittenText,
        language: parsed.detectedLanguage,
      });
      setState(ProcessingState.COMPLETED);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể xử lý tệp. Vui lòng thử lại.");
      setState(ProcessingState.ERROR);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadText = (text: string, filename: string) => {
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFileData(null);
    setResult(null);
    setState(ProcessingState.IDLE);
    setError(null);
    setSearchTerm('');
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 text-slate-900 rounded-sm px-0.5 font-bold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const isPdf = fileData?.mimeType === 'application/pdf';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4 sm:px-6 font-sans">
      {/* Header */}
      <header className="max-w-6xl w-full text-left mb-10 px-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">AI Text Transformer</h1>
        </div>
        <p className="text-blue-500 text-lg font-medium">Trích xuất và tinh chỉnh văn bản từ tài liệu hình ảnh và PDF </p>
      </header>

      <main className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Configuration */}
        <section className="lg:col-span-4 flex flex-col gap-6 sticky top-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div className="mb-6">
              <h2 className="text-sm font-bold text-red-400 tracking-widest mb-4 uppercase">Cấu hình xử lý</h2>
              
              {/* Input Language Select */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-blue-500 mb-2 ml-1">Ngôn ngữ đầu vào</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    value={inputLang}
                    onChange={(e) => setInputLang(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-700 appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Output Language Select */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-red-500 mb-2 ml-1">Ngôn ngữ đầu ra</label>
                <div className="relative">
                  <TypeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                  <select 
                    value={outputLang}
                    onChange={(e) => setOutputLang(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-indigo-50/30 border border-indigo-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-indigo-700 appearance-none cursor-pointer hover:bg-indigo-50 transition-colors"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* NEW: Output Refinement Options */}
              <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <label className="block text-xs font-bold text-slate-500 mb-3 ml-1 flex items-center gap-2">
                  <Settings2 className="w-3.5 h-3.5" />
                  TINH CHỈNH DỮ LIỆU ĐẦU RA
                </label>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="refineMode" 
                      checked={refineMode === 'none'} 
                      onChange={() => setRefineMode('none')}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span className={`text-sm font-medium transition-colors ${refineMode === 'none' ? 'text-indigo-600' : 'text-slate-600 group-hover:text-slate-900'}`}>
                      Không tinh chỉnh
                    </span>
                  </label>

                  <label className="flex flex-col gap-2 cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="refineMode" 
                        checked={refineMode === 'style'} 
                        onChange={() => setRefineMode('style')}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <span className={`text-sm font-medium transition-colors ${refineMode === 'style' ? 'text-indigo-600' : 'text-slate-600 group-hover:text-slate-900'}`}>
                        Phong cách
                      </span>
                    </div>
                    
                    {refineMode === 'style' && (
                      <div className="ml-7 animate-in fade-in slide-in-from-top-1 duration-200">
                        <select 
                          value={selectedStyle}
                          onChange={(e) => setSelectedStyle(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-semibold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
                        >
                          {REFINEMENT_STYLES.map((style) => (
                            <option key={style.value} value={style.value}>{style.label}</option>
                          ))}
                        </select>
                        <p className="mt-1.5 text-[10px] text-slate-400 italic leading-tight">
                          {REFINEMENT_STYLES.find(s => s.value === selectedStyle)?.description}
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Upload Section */}
              <div className={`relative border-2 border-dashed rounded-2xl p-4 transition-all duration-300 min-h-[160px] flex items-center justify-center ${
                fileData ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-200 bg-slate-50 hover:border-indigo-300'
              }`}>
                {!fileData ? (
                  <label className="flex flex-col items-center justify-center w-full py-6 cursor-pointer group text-center">
                    <Upload className="w-8 h-8 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-slate-700 font-semibold block text-sm">Tải lên tài liệu</span>
                    <span className="text-slate-400 text-[10px] mt-1">PDF hoặc Hình ảnh</span>
                    <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" />
                  </label>
                ) : (
                  <div className="relative w-full">
                    <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                      {isPdf ? <FileIcon className="w-8 h-8 text-red-500" /> : <img src={fileData.base64} alt="Preview" className="w-8 h-8 object-cover rounded-md" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-700 font-bold text-[10px] truncate">{fileData.name}</p>
                        <p className="text-slate-400 text-[9px] uppercase font-black">{fileData.mimeType.split('/')[1]}</p>
                      </div>
                      <button onClick={() => setFileData(null)} className="text-slate-300 hover:text-red-500 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!fileData || state === ProcessingState.PROCESSING}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-white shadow-xl shadow-indigo-200 transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
                !fileData || state === ProcessingState.PROCESSING
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {state === ProcessingState.PROCESSING ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Bắt đầu trích xuất
                </>
              )}
            </button>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-medium">
                {error}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 text-slate-900 shadow-xl shadow-slate-100 border border-slate-200 hidden lg:block">
            <h3 className="text-red-600 font-bold text-xs uppercase tracking-widest mb-2">Thông tin hệ thống</h3>
            <p className="text-slate-900 text-sm leading-relaxed font-medium">
              Sử dụng mô hình AI tiên tiến nhất để chuyển đổi tài liệu. Kết quả tinh chỉnh dựa trên bối cảnh và phong cách bạn yêu cầu.
            </p>
          </div>
        </section>

        {/* Expanded Results Section */}
        <section className="lg:col-span-8 flex flex-col gap-8">
          {state === ProcessingState.IDLE && !result && (
            <div className="flex flex-col items-center justify-center h-[600px] text-slate-300 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white/50">
              <div className="p-8 bg-white rounded-full shadow-sm mb-6">
                <FileText className="w-16 h-16 text-slate-100" />
              </div>
              <p className="font-bold text-xl text-slate-400">Kết quả sẽ xuất hiện tại đây</p>
              <p className="text-sm text-slate-300 mt-2">Vui lòng hoàn tất cấu hình và tải tệp lên</p>
            </div>
          )}

          {state === ProcessingState.PROCESSING && (
            <div className="space-y-8 animate-pulse">
              <div className="h-64 bg-white rounded-[2.5rem] border border-slate-100"></div>
              <div className="h-96 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm"></div>
            </div>
          )}

          {result && (
            <div className="space-y-8 pb-12">
              {/* Search Bar */}
              <div className="bg-white px-4 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center sticky top-4 z-10 w-full transition-shadow hover:shadow-md">
                <div className="relative w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm từ khóa trong kết quả..." 
                    className="w-full pl-12 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-red-500 font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Original Text Block */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 transition-all hover:shadow-md">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                      <FileText className="w-4 h-4" />
                      Bản gốc (Transcription)
                    </div>
                    <h3 className="text-xl font-bold text-slate-700">Dữ liệu thô</h3>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => copyToClipboard(result.originalText, 'original')}
                      className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-200 hover:text-slate-600 transition-all"
                    >
                      {copied === 'original' ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={() => downloadText(result.originalText, 'van-ban-goc.txt')}
                      className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-200 hover:text-slate-600 transition-all"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 min-h-[120px]">
                  <p className="text-slate-500 leading-relaxed whitespace-pre-wrap italic text-lg">
                    {highlightText(result.originalText, searchTerm)}
                  </p>
                </div>
              </div>

              {/* AI Transformed Block */}
              <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-100/40 border border-indigo-50 relative overflow-hidden group transition-all hover:shadow-indigo-200/50">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                  <Sparkles className="w-40 h-40 text-indigo-600" />
                </div>
                
                <div className="flex justify-between items-center mb-8 relative">
                  <div>
                    <div className="flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                      <Sparkles className="w-4 h-4" />
                      AI Refinement
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      {refineMode === 'style' 
                        ? `Phong cách: ${REFINEMENT_STYLES.find(s => s.value === selectedStyle)?.label}` 
                        : 'Bản trích xuất (Không tinh chỉnh)'}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => copyToClipboard(result.rewrittenText, 'rewritten')}
                      className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-sm"
                    >
                      {copied === 'rewritten' ? <CheckCircle className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                    </button>
                    <button 
                      onClick={() => downloadText(result.rewrittenText, 'ket-qua-ai.txt')}
                      className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-sm"
                    >
                      <Download className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="relative min-h-[250px]">
                  <p className="text-slate-800 leading-[1.8] whitespace-pre-wrap font-serif-vi text-2xl tracking-tight">
                    {highlightText(result.rewrittenText, searchTerm)}
                  </p>
                </div>
                
                {result.language && (
                  <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Ngôn ngữ nhận diện: {result.language}</span>
                    <span className="text-indigo-500">Optimized by Gemini</span>
                  </div>
                )}
              </div>

              <div className="flex justify-center pt-8">
                 <button 
                  onClick={reset}
                  className="px-10 py-4 bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500 rounded-full font-bold flex items-center gap-3 transition-all shadow-sm active:shadow-none"
                >
                  <RefreshCw className="w-5 h-5" /> Làm mới hệ thống
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto pt-20 pb-12 text-slate-400 text-xs w-full text-center max-w-6xl border-t border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="font-medium">&copy; 2026 AI Text Transformer • Giải pháp xử lý tài liệu thông minh</p>
          <div className="flex gap-8">
            <a 
              href="https://dau.edu.vn/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-red-500 transition-colors font-bold uppercase tracking-wider"
            >
              Da Nang Architecture University
            </a>
            <a 
              href="https://dau-human-resource-management.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-blue-500 transition-colors font-bold uppercase tracking-wider"
            >
              DAU - HRM
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
