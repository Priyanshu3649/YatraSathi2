// Test if PassengerTVL model is properly imported
const { PassengerTVL } = require('./src/models');
console.log('PassengerTVL model loaded successfully:', !!PassengerTVL);

// Test the model by trying to describe its attributes
try {
  const attributes = Object.keys(PassengerTVL.rawAttributes);
  console.log('PassengerTVL attributes:', attributes);
  console.log('Model is ready for use!');
} catch (error) {
  console.error('Error accessing PassengerTVL model:', error.message);
}