import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { reportLovableError } from "@/lib/lovable-error-reporting";

interface Props {
  children: ReactNode;
  title?: string;
  fallback?: (reset: () => void, error: Error) => ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
    reportLovableError(error, { boundary: "component_error_boundary" });
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(this.reset, error);

    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-8 text-center">
        <AlertTriangle className="mx-auto h-6 w-6 text-destructive" />
        <h3 className="mt-3 font-display text-lg font-semibold">
          {this.props.title ?? "This section didn't load"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={this.reset}
          className="mt-5 inline-flex rounded-full border border-primary/40 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-primary hover:bg-primary/10"
        >
          Try again
        </button>
      </div>
    );
  }
}