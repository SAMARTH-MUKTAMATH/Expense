/**
 * BudgetFLOW brand mark.
 *
 * Three ascending bars with rounded tops — represents budget growth /
 * upward trajectory. Reads instantly as a chart, scales cleanly from
 * 16px favicon to 200px hero. Uses currentColor for theme adaptability.
 *
 * Pass `className` to control color and `size` to control pixel size.
 */
export function LogoMark({ size = 24, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Bar 1 — shortest */}
      <rect
        x="3.5"
        y="14"
        width="4"
        height="7"
        rx="1.5"
        fill="currentColor"
      />
      {/* Bar 2 — medium */}
      <rect
        x="10"
        y="9"
        width="4"
        height="12"
        rx="1.5"
        fill="currentColor"
      />
      {/* Bar 3 — tallest */}
      <rect
        x="16.5"
        y="4"
        width="4"
        height="17"
        rx="1.5"
        fill="currentColor"
      />
    </svg>
  );
}
