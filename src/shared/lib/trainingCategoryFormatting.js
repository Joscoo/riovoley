export const formatCategoryLabel = (categoryCode) => {
  if (!categoryCode) return 'Sin categoria';

  return String(categoryCode)
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

