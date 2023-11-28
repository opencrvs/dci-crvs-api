export function pagination(pageSize: number = 5, pageNumber: number = 1) {
  return {
    pageSize,
    pageNumber,
    skip: (pageNumber - 1) * pageSize,
    count: pageSize
  }
}
