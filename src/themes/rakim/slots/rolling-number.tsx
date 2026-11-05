/**
 * Signature motion 1 (plan §11.7, K-28): when the total changes, each digit slides vertically in
 * its own column (Plex Mono tabular figures, 180 ms); a digit that did not change stays put.
 * Columns are keyed from the right, so "195" → "1.230" moves the units, tens and hundreds in
 * place and adds the new ones on the left. Transform only; still under reduced motion (rakim.css).
 * Screen readers get the plain text once.
 */
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function RollingNumber({ text }: { text: string }) {
  const chars = Array.from(text);
  return (
    <span className="rakim-rakam font-mono tabular-nums">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-flex">
        {chars.map((char, index) => {
          const key = chars.length - index;
          if (!/^\d$/.test(char)) {
            return (
              <span key={`s${String(key)}`} className="whitespace-pre">
                {char}
              </span>
            );
          }
          return (
            <span key={`d${String(key)}`} className="rakim-rakam-sutun">
              <span
                className="rakim-rakam-serit"
                style={{ transform: `translateY(-${String(Number(char) * 10)}%)` }}
              >
                {DIGITS.map((digit) => (
                  <span key={digit}>{digit}</span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
