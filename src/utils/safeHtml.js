export const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const stripTags = (value = '') => String(value)
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<[^>]*on\w+[\s=][^>]*>/gi, '')
  .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
  .replace(/<object[\s\S]*?<\/object>/gi, '')
  .replace(/<embed[\s\S]*?<\/embed>/gi, '');

export const formatSafeInline = (value = '') => {
  const escaped = escapeHtml(value);
  const sanitized = stripTags(escaped);
  return sanitized
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/✅/g, '<span class="text-emerald-600 font-bold">✅</span>')
    .replace(/❌/g, '<span class="text-rose-600 font-bold">❌</span>');
};
