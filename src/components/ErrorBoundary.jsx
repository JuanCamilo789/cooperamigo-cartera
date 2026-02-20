import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught', error, info)
    this.setState({ error, info })
  }
  render() {
    if (this.state.error) {
      return (
        <div className="p-8">
          <h2 className="text-red-600 font-bold text-xl mb-4">Ocurrió un error</h2>
          <pre className="whitespace-pre-wrap text-sm text-red-800">{String(this.state.error)}</pre>
          {this.state.info && <pre className="whitespace-pre-wrap text-xs text-slate-500 mt-3">{this.state.info.componentStack}</pre>}
        </div>
      )
    }
    return this.props.children
  }
}
