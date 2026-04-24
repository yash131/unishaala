import { PDFDocument } from 'pdf-lib';

/**
 * Extract the first page of a PDF into a new PDF Buffer.
 * Returns { previewBuffer, pageCount } where previewBuffer is a Uint8Array/Buffer.
 */
export async function extractFirstPage(pdfBuffer) {
  const src = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const pageCount = src.getPageCount();

  const out = await PDFDocument.create();
  if (pageCount > 0) {
    const [copied] = await out.copyPages(src, [0]);
    out.addPage(copied);
  }

  // Set conservative metadata on preview
  out.setTitle('Preview');
  out.setProducer('Unishaala Preview Generator');

  const bytes = await out.save({ useObjectStreams: false });
  return { previewBytes: Buffer.from(bytes), pageCount };
}

/**
 * Validate a buffer is a readable PDF. Returns page count or throws.
 */
export async function getPdfInfo(pdfBuffer) {
  const src = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  return { pageCount: src.getPageCount() };
}
