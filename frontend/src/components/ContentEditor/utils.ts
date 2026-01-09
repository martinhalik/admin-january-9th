// Helper function to compute word-level diff using LCS algorithm
export const computeDiff = (oldText: string, newText: string) => {
  const oldWords = oldText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);

  // Build LCS matrix
  const m = oldWords.length;
  const n = newWords.length;
  const dp: number[][] = Array(m + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0));

  // Fill the LCS matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build the diff
  const result: Array<{ text: string; type: "same" | "added" | "removed" }> =
    [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      // Words match - add to front of result
      result.unshift({ text: oldWords[i - 1], type: "same" });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      // Word was added in new text
      result.unshift({ text: newWords[j - 1], type: "added" });
      j--;
    } else if (i > 0) {
      // Word was removed from old text
      result.unshift({ text: oldWords[i - 1], type: "removed" });
      i--;
    }
  }

  return result;
};

// Get cursor position in pixels within input
export const getCursorCoordinates = (input: HTMLInputElement) => {
  const { value, selectionStart } = input;
  if (selectionStart === null) return null;

  // Create a temporary span to measure text width up to cursor
  const span = document.createElement("span");
  const computed = window.getComputedStyle(input);

  // Copy font styles to measure accurately
  span.style.font = computed.font;
  span.style.fontSize = computed.fontSize;
  span.style.fontFamily = computed.fontFamily;
  span.style.fontWeight = computed.fontWeight;
  span.style.letterSpacing = computed.letterSpacing;
  span.style.visibility = "hidden";
  span.style.position = "absolute";
  span.style.whiteSpace = "pre";

  // Measure text width up to cursor
  span.textContent = value.substring(0, selectionStart);
  document.body.appendChild(span);
  const textWidth = span.getBoundingClientRect().width;
  document.body.removeChild(span);

  // Get input position
  const inputRect = input.getBoundingClientRect();

  // Parse padding from computed style
  const paddingLeft = parseFloat(computed.paddingLeft) || 0;

  // Calculate position
  const left = inputRect.left + paddingLeft + textWidth;
  const top = inputRect.bottom + 4; // 4px below input

  return { left, top };
};
