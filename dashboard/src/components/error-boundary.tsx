import { Component, type ReactNode } from "react"
import { ErrorState } from "@/components/states"

/** Shows an error panel instead of a blank screen when a page crashes while rendering. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error("Page crashed:", error)
  }

  render() {
    if (this.state.error)
      return (
        <ErrorState
          error={new Error(`This page hit an unexpected error: ${this.state.error.message}`)}
          onRetry={() => this.setState({ error: null })}
        />
      )
    return this.props.children
  }
}
