export const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

export const formatSafeInline = (value = '') => escapeHtml(value)
  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.*?)\*/g, '<em>$1</em>')
  .replace(/`(.*?)`/g, '<code>$1</code>')
  .replace(/✅/g, '<span class="text-emerald-600 font-bold">✅</span>')
  .replace(/❌/g, '<span class="text-rose-600 font-bold">❌</span>');
