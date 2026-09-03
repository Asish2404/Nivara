import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="p-6 max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
            <span className="text-2xl mb-3 block">⚠️</span>
            <h2 className="text-lg font-bold text-white mb-2">Display Recovery Active</h2>
            <p className="text-xs text-slate-400 mb-4 font-mono">
              {this.state.error?.message || "An unexpected rendering event occurred."}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
            >
              Reload Interface
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
