import re

file_path = 'frontend/src/components/DynamicAdminPanel.jsx'
with open(file_path, 'r') as f:
    content = f.read()

# Replace the import if missing
if 'useERPFilters' not in content:
    content = content.replace('import { useState, ', 'import { useState, \nimport useERPFilters from \'../hooks/useERPFilters\';')

# Remove the state declaration for filteredData
content = re.sub(r'\n\s*const \[filteredData, setFilteredData\] = useState\(\[\]\);', '', content)

# Remove setFilteredData calls entirely
content = re.sub(r'\s*setFilteredData\([^\)]*\);', '', content)

# Remove the inline filtering useEffect
content = re.sub(r'// ==================== INLINE GRID FILTERS ====================.*?setFilteredData\(filtered\);\n\s*\}, \[filters, data, inlineFilters\]\);', '', content, flags=re.DOTALL)

# Add useERPFilters hook
content = re.sub(r'const \[inlineFilters, setInlineFilters\] = useState\(\{\}\);', '  const { draftFilters: inlineFilters, activeFilters, handleFilterChange: handleInlineFilterChange, applyFiltersManual: applyFilters, clearFiltersManual: clearFilters } = useERPFilters({}, () => { handlePageChange(1); fetchData(1, pagination.pageSize || 50); });', content)

# Replace all inline map filter usages
content = re.sub(r'setInlineFilters\(\{\s*\.\.\.inlineFilters,\s*\[([^\]]+)\]:\s*([^\}]+)\}\)', r'handleInlineFilterChange(\1, \2)', content)

# Inject active filters into the fetchData endpoint string
content = content.replace('${modules[activeModule].endpoint}?page=${page}&limit=${pageSize}', '${modules[activeModule].endpoint}?page=${page}&limit=${pageSize}&${new URLSearchParams(activeFilters).toString()}')

# Make activeFilters a dependency of useEffect fetching data
content = content.replace('[activeModule, fetchTimestamp]', '[activeModule, fetchTimestamp, activeFilters]')

# Replace existing filteredData references with data
content = content.replace('filteredData', 'data')

with open(file_path, 'w') as f:
    f.write(content)
print("Done patching Admin Panel")
