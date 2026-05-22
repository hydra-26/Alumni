import * as XLSX from 'xlsx'

export const exportAlumniToExcel = (data, filename = 'Alumni_Records.xlsx') => {
  if (!data || data.length === 0) return

  // Prepare data for export
  const exportData = data.map(record => ({
    'First Name': record.first_name || '',
    'Last Name': record.last_name || '',
    'Batch Year': record.batch_year || '',
    'Course': record.course || '',
    'Email': record.email || '',
    'Contact': record.contact || '',
    'Employment Status': record.employment_status || '',
    'Company': record.company || '',
  }))

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Alumni')

  // Set column widths
  const colWidths = [15, 15, 12, 12, 25, 15, 18, 20]
  worksheet['!cols'] = colWidths.map(w => ({ wch: w }))

  // Write file
  XLSX.writeFile(workbook, filename)
}

export const exportProjectsToExcel = (data, filename = 'Projects_Records.xlsx') => {
  if (!data || data.length === 0) return

  // Prepare data for export
  const exportData = data.map(record => ({
    'Title': record.title || '',
    'Category': record.category || '',
    'Year': record.year || '',
    'Adviser': record.adviser || '',
    'Members': record.members || '',
    'Status': record.status || '',
    'Award': record.award || '',
    'Abstract': record.abstract || '',
  }))

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects')

  // Set column widths
  const colWidths = [25, 18, 8, 20, 25, 15, 20, 40]
  worksheet['!cols'] = colWidths.map(w => ({ wch: w }))

  // Write file
  XLSX.writeFile(workbook, filename)
}

export const exportAuditLogsToExcel = (data, filename = 'User_Activity_Logs.xlsx') => {
  if (!data || data.length === 0) return

  const exportData = data.map(record => ({
    'Action': record.action || '',
    'Actor': record.actor || '',
    'Date/Time': record.created_at ? new Date(record.created_at).toLocaleString('en-PH') : '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Activity Logs')

  const colWidths = [50, 18, 22]
  worksheet['!cols'] = colWidths.map(w => ({ wch: w }))

  XLSX.writeFile(workbook, filename)
}
