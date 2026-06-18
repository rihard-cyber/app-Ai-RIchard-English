import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen min-h-[100dvh] bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <AlertTriangle className="text-amber-500 mb-4" size={64} />
          <h2 className="text-3xl font-black mb-2">Terjadi Kesalahan</h2>
          <p className="text-slate-400 mb-8 max-w-md">
            Maaf, terjadi kesalahan yang tidak terduga. Silakan muat ulang aplikasi.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-500/30 flex items-center gap-2"
          >
            <RefreshCw size={18} /> Muat Ulang Aplikasi
          </button>
          {this.props.fallback && this.props.fallback}
        </div>
      );
    }

    return this.props.children;
  }
}
