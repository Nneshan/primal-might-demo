/** Текст с *курсивом* внутри предложения */
export function renderRichText(text) {
  if (!text) {
    return null;
  }
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}
