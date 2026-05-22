"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  label?: string;
};

type State = {
  hasError: boolean;
  errorMessage?: string;
};

// preview 영역에서 발생한 렌더 에러를 격리해서 create 페이지 전체가 흰 화면이 되지 않도록 한다.
export default class PreviewErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, errorMessage: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("[PreviewErrorBoundary] 렌더 중단", {
      label: this.props.label,
      error: error instanceof Error ? error.message : String(error),
      componentStack: info.componentStack,
    });
  }

  componentDidUpdate(prevProps: Props) {
    // children이 바뀌면 에러 상태 리셋 — 새로운 데이터로 다시 시도
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: undefined });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-[420px] place-items-center bg-[#fff7f4] px-6 py-10 text-center text-[12px] text-[#a85f4b]">
          <div>
            <p className="font-semibold">미리보기를 표시하지 못했습니다</p>
            <p className="mt-2 text-[11px] text-[#a98274]">
              일부 사진을 불러오지 못했지만 편집은 그대로 진행할 수 있습니다.
            </p>
            {this.state.errorMessage && (
              <p className="mt-3 max-w-[260px] truncate text-[10px] text-[#c89d8e]" title={this.state.errorMessage}>
                {this.state.errorMessage}
              </p>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
