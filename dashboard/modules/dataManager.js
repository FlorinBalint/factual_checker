/**
 * Data Management Module
 * Handles CSV loading, parsing, and data filtering
 */
export class DataManager {
  constructor() {
    this.politiciansData = [];
    this.filteredData = [];
  }

  /**
   * Load and parse CSV data from URL
   */
  async loadCSVData(csvUrl = './politician_stats.csv') {
    try {
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error('CSV file not found');
      }
      const csvText = await response.text();
      this.parseCSVText(csvText);
      return this.politiciansData;
    } catch (error) {
      console.error('Failed to load politician stats:', error);
      throw error;
    }
  }

  /**
   * Parse CSV text and clean data
   */
  parseCSVText(csvText) {
    Papa.parse(csvText, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      complete: (results) => {
        this.processData(results.data);
      },
      error: (error) => {
        console.error('Error parsing CSV text:', error);
        throw error;
      }
    });
  }

  /**
   * Process and clean raw CSV data
   */
  processData(rawData) {
    this.politiciansData = rawData.map(row => {
      // Clean column names and handle Romanian characters
      const cleanRow = {};
      Object.keys(row).forEach(key => {
        const cleanKey = key.trim().replace(/[^\w\s]/g, '');
        cleanRow[cleanKey] = row[key];
      });

      // Extract credibility percentage
      let credibilitate = 0;
      if (cleanRow.Credibilitate) {
        const credStr = cleanRow.Credibilitate.toString().replace('%', '').replace(',', '.');
        credibilitate = parseFloat(credStr) || 0;
      }

      return {
        nume: cleanRow.Nume || '',
        afiliere: cleanRow.Afiliere || '',
        credibilitate: credibilitate,
        numarDeclaratii: parseInt(cleanRow['Numr declaraii'] || cleanRow['Număr declarații'] || 0) || 0,
        imposibilDeVerificat: parseInt(cleanRow['Imposibil de verificat'] || 0) || 0,
        trunchiate: parseInt(cleanRow.Trunchiate || 0) || 0,
        false: parseInt(cleanRow.False || 0) || 0,
        partialAdevarate: parseInt(cleanRow['Parial adevrate'] || cleanRow['Parțial adevărate'] || 0) || 0,
        adevarate: parseInt(cleanRow.Adevrate || cleanRow['Adevărate'] || 0) || 0
      };
    }).filter(p => p.nume && p.nume.trim() !== '' && p.numarDeclaratii > 0);

    this.filteredData = [...this.politiciansData];
  }

  /**
   * Apply filters to the data
   */
  applyFilters(filters) {
    const { party, credibility, name, minStatements } = filters;
    
    this.filteredData = this.politiciansData.filter(p => {
      if (party && p.afiliere !== party) return false;
      if (p.credibilitate < credibility) return false;
      if (name && !p.nume.toLowerCase().includes(name.toLowerCase())) return false;
      if (p.numarDeclaratii < minStatements) return false;
      return true;
    });

    return this.filteredData;
  }

  /**
   * Get all unique parties
   */
  getParties() {
    return [...new Set(this.politiciansData.map(p => p.afiliere))]
      .filter(party => party && party.trim() !== '')
      .sort();
  }

  /**
   * Get statistics for current data
   */
  getStatistics(useFiltered = false) {
    const dataToUse = useFiltered ? this.filteredData : this.politiciansData;
    const totalPoliticians = dataToUse.length;
    
    const avgPoliticianCredibility = totalPoliticians > 0 
      ? (dataToUse.reduce((sum, p) => sum + p.credibilitate, 0) / totalPoliticians).toFixed(1) 
      : '0';
    
    const totalStatements = dataToUse.reduce((sum, p) => sum + p.numarDeclaratii, 0);
    const totalTrue = dataToUse.reduce((sum, p) => sum + p.adevarate, 0);
    const totalFalse = dataToUse.reduce((sum, p) => sum + p.false, 0);
    const totalPartialTrue = dataToUse.reduce((sum, p) => sum + p.partialAdevarate, 0);
    const totalTruncated = dataToUse.reduce((sum, p) => sum + p.trunchiate, 0);
    const totalUnverifiable = dataToUse.reduce((sum, p) => sum + p.imposibilDeVerificat, 0);

    const avgStatementCredibility = totalStatements > 0 
      ? ((totalTrue * 100 + totalPartialTrue * 50 + totalTruncated * 25 + totalFalse * 0) / totalStatements).toFixed(1) 
      : '0';

    return {
      totalPoliticians,
      avgPoliticianCredibility,
      avgStatementCredibility,
      totalStatements,
      totalTrue,
      totalFalse,
      totalPartialTrue,
      totalTruncated,
      totalUnverifiable
    };
  }

  /**
   * Get party statistics for chart
   */
  getPartyStatistics(useFiltered = false) {
    const dataToUse = useFiltered ? this.filteredData : this.politiciansData;
    const partyStats = {};
    
    dataToUse.forEach(p => {
      if (!partyStats[p.afiliere]) {
        partyStats[p.afiliere] = { count: 0, totalCredibility: 0 };
      }
      partyStats[p.afiliere].count++;
      partyStats[p.afiliere].totalCredibility += p.credibilitate;
    });

    return Object.keys(partyStats).map(party => ({
      party,
      avgCredibility: partyStats[party].totalCredibility / partyStats[party].count,
      count: partyStats[party].count
    })).sort((a, b) => b.count - a.count);
  }

  /**
   * Get sorted politicians data
   */
  getSortedPoliticians(column = 'credibilitate', direction = 'desc', useFiltered = false) {
    const dataToUse = useFiltered ? this.filteredData : this.politiciansData;
    const sortedData = [...dataToUse];

    sortedData.sort((a, b) => {
      let aVal = a[column];
      let bVal = b[column];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return sortedData;
  }

  /**
   * Get paginated data
   */
  getPaginatedData(data, page = 1, perPage = 10) {
    const totalPages = Math.ceil(data.length / perPage);
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    
    return {
      data: data.slice(startIndex, endIndex),
      totalPages,
      currentPage: page,
      totalItems: data.length
    };
  }

  // Getters
  getAllData() {
    return this.politiciansData;
  }

  getFilteredData() {
    return this.filteredData;
  }
}