export const buildPageItems = (currentPage, totalPages) => {
  const pageItems = [];

  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i += 1) {
      pageItems.push(i);
    }
  } else {
    const showStartEllipsis = currentPage > 3;
    const showEndEllipsis = currentPage < totalPages - 2;

    pageItems.push(1);

    if (showStartEllipsis) pageItems.push("start-ellipsis");

    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i += 1) {
      pageItems.push(i);
    }

    if (showEndEllipsis) pageItems.push("end-ellipsis");

    pageItems.push(totalPages);
  }

  return pageItems;
};
