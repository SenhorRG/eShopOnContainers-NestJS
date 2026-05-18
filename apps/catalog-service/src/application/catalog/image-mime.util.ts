/** Aligns with `CatalogApi.GetImageMimeTypeFromImageFileExtension`. */
export function imageMimeFromExtension(extension: string): string {
  const lower = extension.toLowerCase();
  switch (lower) {
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.bmp':
      return 'image/bmp';
    case '.tiff':
      return 'image/tiff';
    case '.wmf':
      return 'image/wmf';
    case '.jp2':
      return 'image/jp2';
    case '.svg':
      return 'image/svg+xml';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}
