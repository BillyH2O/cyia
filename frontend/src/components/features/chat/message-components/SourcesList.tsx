import React from 'react';

export interface SourcesListProps {
  sources: Array<{ content: string; metadata?: any }>;
}

export const SourcesList: React.FC<SourcesListProps> = ({ sources }) => (
  <div className="mt-2 pt-2 border-t border-border/30">
    <p className="text-xs font-semibold mb-1">Sources:</p>
    <ul className="space-y-1">
      {sources.map((source, idx) => (
        <li key={idx} className="text-xs text-muted-foreground truncate">
          <a
            href={source.metadata?.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline hover:text-foreground transition-colors"
            title={source.content}
          >
            {source.metadata?.title || source.metadata?.url || `Source ${idx + 1}`}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

export default SourcesList; 