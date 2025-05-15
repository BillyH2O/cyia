import React from 'react';

export interface EvaluationProps {
  evaluation: string;
}

export const Evaluation: React.FC<EvaluationProps> = ({ evaluation }) => (
  <div className="mt-2 pt-2 border-t border-border/30">
    <p className="text-xs font-semibold mb-1">Évaluation des sources:</p>
    <p className="text-xs text-muted-foreground">{evaluation}</p>
  </div>
);

export default Evaluation; 