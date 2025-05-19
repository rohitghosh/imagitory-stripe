export function buildPages({ title, coverUrl, backCoverUrl, pages }) {
  const middle = pages.map((p, i) => ({
    id: i + 2,
    imageUrl: p.imageUrl ?? p,
    content: p.content ?? "",
  }));

  return [
    coverUrl && { id: 1, imageUrl: coverUrl, content: title, isCover: true },
    ...middle,
    backCoverUrl && {
      id: middle.length + 2,
      imageUrl: backCoverUrl,
      content: "",
      isBackCover: true,
    },
  ].filter(Boolean);
}
