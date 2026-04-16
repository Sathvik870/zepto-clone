import React, { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { motion, AnimatePresence } from "framer-motion";
import { HiX, HiOutlineDownload, HiOutlineRefresh } from "react-icons/hi";
import api from "../../api";

pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

interface PDFViewerModalProps {
  invoiceCode: string | null;
  onClose: () => void;
}

const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  invoiceCode,
  onClose,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);

  useEffect(() => {
    if (!invoiceCode) return;

    const fetchPdf = async () => {
      setLoading(true);
      setError(null);
      setPdfUrl(null);
      try {
        const response = await api.get(
          `/api/customer/orders/${invoiceCode}/pdf`,
          {
            responseType: "blob",
          }
        );

        const file = new Blob([response.data], { type: "application/pdf" });
        const fileURL = URL.createObjectURL(file);
        setPdfUrl(fileURL);
      } catch (err) {
        setError("Failed to load invoice PDF.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPdf();

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [invoiceCode]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <AnimatePresence>
      {invoiceCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000039]">
          <motion.div
            className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-[90vh] flex flex-col overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex-shrink-0 p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-semibold">Invoice: {invoiceCode}</h2>
              <div className="flex items-center gap-4">
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    download={`invoice-${invoiceCode}.pdf`}
                    className="flex items-center gap-2 text-sm font-semibold text-[#14A34A] hover:text-[#387c40]"
                  >
                    <HiOutlineDownload size={20} />
                    Download
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-black"
                >
                  <HiX size={24} />
                </button>
              </div>
            </div>
            <div className="flex-grow overflow-auto p-4">
              {loading && (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <HiOutlineRefresh className="animate-spin h-8 w-8 mr-2" />
                  Loading Invoice...
                </div>
              )}
              {error && (
                <div className="text-center text-red-500 p-8">{error}</div>
              )}
              {pdfUrl && (
                <Document
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading=""
                >
                  {Array.from(new Array(numPages), (_el, index) => (
                    <Page
                      key={`page_${index + 1}`}
                      pageNumber={index + 1}
                      width={700}
                      className="mb-4 shadow-lg "
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  ))}
                </Document>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PDFViewerModal;
