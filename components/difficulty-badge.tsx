import {levelTone,normalizeLevel} from '@/lib/article-meta';

export default function DifficultyBadge({difficulty}:{difficulty:string}){
  const level=normalizeLevel(difficulty);
  return (
    <span className={`level-badge ${levelTone(level)}`}>
      {level}
    </span>
  );
}
