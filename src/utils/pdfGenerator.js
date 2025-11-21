const PDFDocument = require('pdfkit');
const fs = require('fs');

const generateTravelPlanPDF = (travelPlan, filePath) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a document
      const doc = new PDFDocument();
      
      // Pipe its output somewhere, like to a file or HTTP response
      const stream = doc.pipe(fs.createWriteStream(filePath));
      
      // Embed a font, set the font size, and render some text
      doc.fontSize(20).text('Travel Plan', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(16).text(`Title: ${travelPlan.title}`);
      doc.moveDown();
      
      doc.fontSize(12).text(`Destination: ${travelPlan.destination}`);
      doc.text(`Start Date: ${new Date(travelPlan.startDate).toDateString()}`);
      doc.text(`End Date: ${new Date(travelPlan.endDate).toDateString()}`);
      doc.text(`Budget: $${travelPlan.budget}`);
      doc.moveDown();
      
      doc.fontSize(14).text('Description:');
      doc.fontSize(12).text(travelPlan.description);
      doc.moveDown();
      
      if (travelPlan.activities && travelPlan.activities.length > 0) {
        doc.fontSize(14).text('Activities:');
        travelPlan.activities.forEach((activity, index) => {
          doc.fontSize(12).text(`${index + 1}. ${activity.name}`);
          doc.text(`   Date: ${new Date(activity.date).toDateString()}`);
          doc.text(`   Location: ${activity.location}`);
          doc.text(`   Description: ${activity.description}`);
          doc.moveDown();
        });
      }
      
      // Finalize PDF file
      doc.end();
      
      stream.on('finish', () => {
        resolve(filePath);
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateTravelPlanPDF
};