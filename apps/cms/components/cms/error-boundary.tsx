"use client";

import { Component, type PropsWithChildren, type ReactNode } from "react";

type State = { error: Error | null };

/**
 * Catches render-time crashes in the admin surface so a single bad screen shows
 * a recoverable error instead of white-screening the whole CMS.
 */
export class CmsErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  reset = () => this.setState({ error: null });

  render(): ReactNode {
    if (this.state.error) {
      return (
        <main className="page">
          <section className="panel">
            <p className="page__crumb">Erreur</p>
            <h2 className="panel-title">Un problème est survenu</h2>
            <p className="empty-copy">{this.state.error.message}</p>
            <div className="stack-actions" style={{ marginTop: 16 }}>
              <button className="primary-button" onClick={this.reset} type="button">
                Réessayer
              </button>
            </div>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
