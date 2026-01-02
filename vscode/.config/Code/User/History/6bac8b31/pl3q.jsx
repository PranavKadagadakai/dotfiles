import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    // Log error if needed
    // console.error(error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div className="text-red-600 p-4">Something went wrong. Please reload the page.</div>;
    }
    return this.props.children;
  }
}