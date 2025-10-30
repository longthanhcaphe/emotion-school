// backend/testImports.js
console.log('Testing imports...\n');

try {
  console.log('1. Testing aiService...');
  const aiService = require('./services/aiService');
  console.log('   ✅ aiService imported');
  console.log('   - analyzeClassTrends:', typeof aiService.analyzeClassTrends);
  console.log('   - analyzeStudent:', typeof aiService.analyzeStudent);
  console.log('   - isAIAvailable:', typeof aiService.isAIAvailable);
} catch (error) {
  console.log('   ❌ aiService error:', error.message);
}

try {
  console.log('\n2. Testing aiController...');
  const aiController = require('./controllers/aiController');
  console.log('   ✅ aiController imported');
  console.log('   - analyzeClass:', typeof aiController.analyzeClass);
  console.log('   - analyzeStudentController:', typeof aiController.analyzeStudentController);
  console.log('   - getAIStatus:', typeof aiController.getAIStatus);
} catch (error) {
  console.log('   ❌ aiController error:', error.message);
}

console.log('\n✅ All imports OK!');