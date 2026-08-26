import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full border border-zinc-200 shadow-lg text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 mb-2">เกิดข้อผิดพลาดในการโหลดข้อมูล</h2>
            <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
              อาจเกิดจากข้อมูลในเครื่องไม่สมบูรณ์หรือการอัปเดตเวอร์ชัน กรุณากดปุ่มด้านล่างเพื่อรีเซ็ตและเปิดแอปใหม่อีกครั้ง
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                โหลดหน้านี้ใหม่
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>รีเซ็ตข้อมูลเริ่มต้น</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
