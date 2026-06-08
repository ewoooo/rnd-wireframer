import styles from './SearchBar.module.css';
import micIcon from './assets/icon-mic.svg';
import searchIcon from './assets/icon-search.svg';

/* Figma: SearchBar — node 9914:57887
   type=LLM : 회색 pill + 파란 마이크 버튼 (AI 검색)
   type=search : 회색 pill + 돋보기 아이콘 (일반 검색)
*/
interface SearchBarProps {
  type?: 'LLM' | 'search';
  placeholder?: string;
  onSearch?: () => void;
}

export function SearchBar({
  type = 'LLM',
  placeholder,
  onSearch,
}: SearchBarProps) {
  if (type === 'LLM') {
    return (
      <div className={styles.llmWrap}>
        <span className={styles.llmPlaceholder}>
          {placeholder ?? '무엇을 도와드릴까요?'}
        </span>
        <button className={styles.llmBtn} onClick={onSearch} aria-label="AI 검색">
          <img src={micIcon} alt="" width={20} height={20} />
        </button>
      </div>
    );
  }

  return (
    <div className={styles.searchWrap}>
      <div className={styles.searchInner}>
        <span className={styles.searchPlaceholder}>
          {placeholder ?? '검색'}
        </span>
        <img src={searchIcon} alt="" width={20} height={20} className={styles.searchIcon} />
      </div>
    </div>
  );
}
