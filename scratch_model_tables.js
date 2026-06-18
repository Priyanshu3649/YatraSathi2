const models = require('./src/models');

const modelTableMap = {};
for (const [modelName, model] of Object.entries(models)) {
  if (model && model.tableName) {
    modelTableMap[modelName] = model.tableName;
  }
}

console.log('--- MODELS TO TABLE NAME MAP ---');
console.log(JSON.stringify(modelTableMap, null, 2));
console.log(`Total Models: ${Object.keys(modelTableMap).length}`);
process.exit(0);
