import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ExportControls = ({ jobs }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const exportToExcel = () => {
    // Match original script.js data structure exactly
    const dataToExport = jobs.map(job => ({
      'Area': job.area,
      'Landmark': job.landmark,
      'Job Type': job.category,
      'Staff Name': job.staffName,
      'Address': job.customerAddress || job.address || '',
      'Timestamp': job.timestamp?.toDate?.()?.toLocaleString() || new Date(job.timestamp.seconds * 1000).toLocaleString(),
      'Location': job.coordinates ? `https://maps.google.com/?q=${job.coordinates.lat},${job.coordinates.lng}` : (job.location ? `https://maps.google.com/?q=${job.location.lat},${job.location.lng}` : ''),
      'Photos': (job.photoURLs || job.photos || []).join(', ')
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Jobs");
    XLSX.writeFile(workbook, "Cable_Operations_Export.xlsx");
    setShowDropdown(false);
  };

  // Helper function to convert image URL to base64
  const imageUrlToBase64 = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return null;
    }
  };

  const exportToPDF = async () => {
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      let y = 20;

      if (i > 0) {
        doc.addPage();
      }

      // Match original script.js PDF format exactly
      doc.setFontSize(16);
      doc.text("Job Report", pageWidth / 2, y, { align: 'center' });
      y += 10;
      doc.setFontSize(10);
      
      const timestamp = job.timestamp?.toDate?.()?.toLocaleString() || 
                       (job.timestamp?.seconds ? new Date(job.timestamp.seconds * 1000).toLocaleString() : 
                        new Date(job.timestamp).toLocaleString());
      
      doc.text(`Timestamp: ${timestamp}`, margin, y);
      y += 7;
      doc.text(`Staff Name: ${job.staffName}`, margin, y);
      y += 7;
      doc.text(`Area: ${job.area}, ${job.landmark}`, margin, y);
      y += 7;
      doc.text(`Job Type: ${job.category}`, margin, y);
      y += 7;
      doc.text(`Address: ${job.customerAddress || job.address || 'N/A'}`, margin, y);
      y += 7;
      
      // Add location link if coordinates exist
      const coordinates = job.coordinates || job.location;
      if (coordinates) {
        const locationLink = `https://maps.google.com/?q=${coordinates.lat},${coordinates.lng}`;
        doc.setTextColor(0, 0, 255);
        doc.textWithLink('View on Map', margin, y, { url: locationLink });
        doc.setTextColor(0, 0, 0);
      }
      y += 10;

      // Add photos if they exist
      const photos = job.photoURLs || job.photos || [];
      if (photos && photos.length > 0) {
        doc.setFontSize(12);
        doc.text("Photos:", margin, y);
        y += 5;

        for (const url of photos) {
          try {
            const base64Image = await imageUrlToBase64(url);
            if (base64Image) {
              const imgProps = doc.getImageProperties(base64Image);
              const imgWidth = 80;
              const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

              if (y + imgHeight > pageHeight - margin) {
                doc.addPage();
                y = margin;
              }

              doc.addImage(base64Image, 'JPEG', margin, y, imgWidth, imgHeight);
              y += imgHeight + 5;
            }
          } catch (e) {
            console.error("Error adding image to PDF", e);
            if (y + 10 > pageHeight - margin) {
              doc.addPage();
              y = margin;
            }
            doc.text("Could not load image.", margin, y);
            y += 10;
          }
        }
      }
    }

    doc.save("Cable_Operations_Report.pdf");
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        Export
        <i className="fas fa-chevron-down ml-2"></i>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1">
            <button
              onClick={exportToExcel}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <i className="fas fa-file-excel mr-2 text-green-600"></i>
              Export to Excel
            </button>
            <button
              onClick={exportToPDF}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <i className="fas fa-file-pdf mr-2 text-red-600"></i>
              Export to PDF
            </button>
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(false)}
        ></div>
      )}
    </div>
  );
};

export default ExportControls;
