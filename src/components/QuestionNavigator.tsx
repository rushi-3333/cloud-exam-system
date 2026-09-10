import clsx from 'clsx';

interface QuestionNavigatorProps {
  count: number;
  currentIndex: number;
  answeredSet: Set<number>;
  markedSet: Set<number>;
  visitedSet: Set<number>;
  onJump: (index: number) => void;
}

export function QuestionNavigator({
  count,
  currentIndex,
  answeredSet,
  markedSet,
  visitedSet,
  onJump,
}: QuestionNavigatorProps) {
  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: count }, (_, i) => {
          const isCurrent = i === currentIndex;
          const isAnswered = answeredSet.has(i);
          const isMarked = markedSet.has(i);
          const isVisited = visitedSet.has(i);

          return (
            <button
              key={i}
              onClick={() => onJump(i)}
              className={clsx(
                'flex h-9 w-9 items-center justify-center rounded-lg text-xs font-medium transition',
                isCurrent && 'ring-2 ring-brand-500',
                isMarked
                  ? 'bg-purple-100 text-purple-700'
                  : isAnswered
                  ? 'bg-emerald-100 text-emerald-700'
                  : isVisited
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-500'
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-1.5 text-xs text-slate-500">
        <Legend swatch="bg-emerald-100" label="Answered" />
        <Legend swatch="bg-purple-100" label="Marked for review" />
        <Legend swatch="bg-amber-100" label="Visited, not answered" />
        <Legend swatch="bg-slate-100" label="Not visited" />
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={clsx('h-3 w-3 rounded', swatch)} />
      {label}
    </div>
  );
}
