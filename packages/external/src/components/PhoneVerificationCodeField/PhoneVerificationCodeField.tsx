import styles from './PhoneVerificationCodeField.module.css';

type VerificationState = 'idle' | 'sent' | 'expired';

interface PhoneVerificationCodeFieldProps {
  label?: string;
  placeholder?: string;
  helperText?: string;
  value?: string;
  // 인증 flow 상태: idle(발송 전) / sent(발송됨, 카운트다운) / expired(만료, 재요청 유도)
  state?: VerificationState;
  // sent 상태에서 표시할 남은 제한시간(초). 표시 전용 — 실제 카운트다운 동작은 앱 통합 책임.
  remainingSeconds?: number;
  // 발송 직후 안내 문구(예: "인증번호를 보내드렸어요").
  sentNotice?: string;
  // idle 상태의 발송 액션 라벨(예: "인증 요청").
  sendActionLabel?: string;
  // sent/expired 상태의 재요청 액션 라벨(예: "재요청").
  resendActionLabel?: string;
  onChange?: (value: string) => void;
  onRequest?: () => void;
  onResend?: () => void;
}

// 남은 초를 "N분 N초"로 표시한다. 음수는 0으로 클램프한다.
function formatRemaining(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}분 ${seconds}초`;
}

export function PhoneVerificationCodeField({
  label,
  placeholder = '인증번호 입력',
  helperText,
  value = '',
  state = 'idle',
  remainingSeconds = 0,
  sentNotice = '인증번호를 보내드렸어요',
  sendActionLabel = '인증 요청',
  resendActionLabel = '재요청',
  onChange,
  onRequest,
  onResend,
}: PhoneVerificationCodeFieldProps) {
  const isSent = state === 'sent';
  const isExpired = state === 'expired';
  const actionLabel = state === 'idle' ? sendActionLabel : resendActionLabel;
  const onAction = state === 'idle' ? onRequest : onResend;

  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.inputRow}>
        <div className={[styles.input, isExpired ? styles.expired : ''].filter(Boolean).join(' ')}>
          <input
            className={styles.inputField}
            type="text"
            inputMode="numeric"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
          />
          {isSent && <span className={styles.countdown}>{formatRemaining(remainingSeconds)}</span>}
        </div>
        <button
          type="button"
          className={[styles.actionButton, state !== 'idle' ? styles.actionResend : '']
            .filter(Boolean)
            .join(' ')}
          onClick={() => onAction?.()}
        >
          {actionLabel}
        </button>
      </div>
      {(isSent || isExpired || helperText) && (
        <p
          className={[styles.helperText, isExpired ? styles.helperExpired : '']
            .filter(Boolean)
            .join(' ')}
        >
          {isExpired ? '인증 시간이 만료됐어요. 다시 요청해 주세요.' : isSent ? sentNotice : helperText}
        </p>
      )}
    </div>
  );
}
