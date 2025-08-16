let politiciansData = [];
let filteredData = [];
let charts = {}; // Store chart instances
let currentPage = 1;
let rowsPerPage = 50;
let topPoliticiansCurrentPage = 1;
let topPoliticiansPerPage = 10;
let sortColumn = 'credibilitate';
let sortDirection = 'desc';
let isUpdatingFilters = false;

// Styling is now handled in dashboard_style.css

// Auto-load functionality only

// Auto-load local CSV file on page load
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loading').style.display = 'block';
  
  // Load local CSV file
  fetch('./politician_stats.csv')
    .then(response => {
      if (response.ok) {
        return response.text();
      }
      throw new Error('Local CSV not found');
    })
    .then(csvText => {
      parseCSVText(csvText, false);
    })
    .catch(error => {
      console.error('Failed to load politician stats:', error);
      document.getElementById('loading').style.display = 'none';
      
      // Show error message instead of upload zone
      const statusZone = document.querySelector('.status-zone');
      if (statusZone) {
        statusZone.innerHTML = `
          <div style="font-size: 1.2em; margin-bottom: 10px;">❌ Eroare la încărcarea datelor</div>
          <div style="font-size: 0.9em; opacity: 0.9;">Nu s-au putut încărca datele politicienilor. Vă rugăm să reîncercați mai târziu.</div>
        `;
        statusZone.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
      }
    });
});

// Filter event listeners
document.getElementById('applyFilters').addEventListener('click', applyFilters);
// Remove immediate filter listeners for name and min statements
// These will only apply when button is pressed
document.getElementById('rowsPerPage').addEventListener('change', (e) => {
  rowsPerPage = e.target.value === 'all' ? politiciansData.length : parseInt(e.target.value);
  currentPage = 1;
  generateTable();
});

document.getElementById('topPoliticiansPerPage').addEventListener('change', (e) => {
  topPoliticiansPerPage = parseInt(e.target.value);
  topPoliticiansCurrentPage = 1;
  if (charts.topPoliticians) {
    charts.topPoliticians.destroy();
  }
  generateTopPoliticiansChart();
});

// Removed upload and URL loading functions - data is now loaded automatically

function parseCSVText(data, isFromFile = false) {
  console.log('Raw parsed data:', data);

  if (!isFromFile) {
    // If from URL, parse with Papa
    Papa.parse(data, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      complete: function (results) {
        processData(results.data);
      },
      error: function (error) {
        console.error('Error parsing CSV text:', error);
        document.getElementById('loading').style.display = 'none';
        alert('Eroare la procesarea datelor CSV!');
      }
    });
  } else {
    processData(data);
  }
}

function processData(data) {
  // Clean and process the data
  politiciansData = data.map(row => {
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

  console.log('Processed data:', politiciansData);
  filteredData = [...politiciansData];

  setTimeout(() => {
    document.getElementById('loading').style.display = 'none';
    setupFilters();
    generateDashboard();
  }, 500);
}

function destroyAllCharts() {
  Object.values(charts).forEach(chart => {
    if (chart) {
      chart.destroy();
    }
  });
  charts = {};
}

function generateDashboard() {
  generateStats();
  generateTopPoliticiansChart();
  generatePartyChart();
  generateTable();
  updateChartTitles();
  document.getElementById('dashboard').style.display = 'block';
}

function generateStats() {
  const statsGrid = document.getElementById('statsGrid');
  const dataToUse = filteredData.length > 0 ? filteredData : politiciansData;
  const totalPoliticians = dataToUse.length;
  const avgPoliticianCredibility = totalPoliticians > 0 ? (dataToUse.reduce((sum, p) => sum + p.credibilitate, 0) / totalPoliticians).toFixed(1) : '0';
  const totalStatements = dataToUse.reduce((sum, p) => sum + p.numarDeclaratii, 0);
  const totalTrue = dataToUse.reduce((sum, p) => sum + p.adevarate, 0);
  const totalFalse = dataToUse.reduce((sum, p) => sum + p.false, 0);
  const totalPartialTrue = dataToUse.reduce((sum, p) => sum + p.partialAdevarate, 0);
  const totalTruncated = dataToUse.reduce((sum, p) => sum + p.trunchiate, 0);
  const totalUnverifiable = dataToUse.reduce((sum, p) => sum + p.imposibilDeVerificat, 0);

  // Calculate weighted average statement credibility
  const avgStatementCredibility = totalStatements > 0 ?
    ((totalTrue * 100 + totalPartialTrue * 50 + totalFalse * 0) / totalStatements).toFixed(1) : '0';

  statsGrid.innerHTML = `
                <div class="stat-card politicians">
                    <div class="stat-value politicians">${totalPoliticians}</div>
                    <div class="stat-label">Politicieni ${filteredData.length > 0 && filteredData.length !== politiciansData.length ? 'filtrați' : 'analizați'}</div>
                </div>
                <div class="stat-card credibility-politicians">
                    <div class="stat-value credibility-politicians">${avgPoliticianCredibility}%</div>
                    <div class="stat-label">Credibilitate medie politicieni</div>
                </div>
                <div class="stat-card credibility-statements">
                    <div class="stat-value credibility-statements">${avgStatementCredibility}%</div>
                    <div class="stat-label">Credibilitate medie declarații</div>
                </div>
                <div class="stat-card total-statements">
                    <div class="stat-value total-statements">${totalStatements.toLocaleString()}</div>
                    <div class="stat-label">Total declarații</div>
                </div>
                <div class="stat-card true-statements">
                    <div class="stat-value true-statements">${totalTrue.toLocaleString()}</div>
                    <div class="stat-label">Declarații adevărate</div>
                </div>
                <div class="stat-card partial-true">
                    <div class="stat-value partial-true">${totalPartialTrue.toLocaleString()}</div>
                    <div class="stat-label">Parțial adevărate</div>
                </div>
                <div class="stat-card truncated">
                    <div class="stat-value truncated">${totalTruncated.toLocaleString()}</div>
                    <div class="stat-label">Trunchiate</div>
                </div>
                <div class="stat-card false-statements">
                    <div class="stat-value false-statements">${totalFalse.toLocaleString()}</div>
                    <div class="stat-label">Declarații false</div>
                </div>
            `;
}

function generateTopPoliticiansChart() {
  // Get paginated data
  const sortedFiltered = filteredData.sort((a, b) => b.credibilitate - a.credibilitate);
  const totalPages = Math.ceil(sortedFiltered.length / topPoliticiansPerPage);
  const startIndex = (topPoliticiansCurrentPage - 1) * topPoliticiansPerPage;
  const endIndex = startIndex + topPoliticiansPerPage;
  const currentData = sortedFiltered.slice(startIndex, endIndex);

  // Update pagination
  updateTopPoliticiansPagination(totalPages);

  const canvas = document.getElementById('topPoliticiansChart');
  const ctx = canvas.getContext('2d');

  // Set fixed canvas dimensions to prevent size issues
  canvas.width = 800;
  canvas.height = Math.min(500, currentData.length * 35 + 100);

  charts.topPoliticians = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: currentData.map(p => p.nume),
      datasets: [{
        label: 'Credibilitate (%)',
        data: currentData.map(p => p.credibilitate === 0 ? 0.5 : p.credibilitate),
        backgroundColor: currentData.map((_, i) => `hsla(${200 + i * 10}, 70%, 60%, 0.8)`),
        borderColor: currentData.map((_, i) => `hsla(${200 + i * 10}, 70%, 50%, 1)`),
        borderWidth: 2
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: false,
      maintainAspectRatio: false,
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function (value) {
              return value + '%';
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            title: function (context) {
              const index = context[0].dataIndex;
              return currentData[index].nume;
            },
            label: function (context) {
              const politician = currentData[context.dataIndex];
              return [
                `Credibilitate: ${politician.credibilitate.toFixed(1)}%`,
                `Partid: ${politician.afiliere}`,
                `Total declarații: ${politician.numarDeclaratii}`,
                `Adevărate: ${politician.adevarate}`,
                `Parțial adevărate: ${politician.partialAdevarate}`,
                `False: ${politician.false}`,
                `Trunchiate: ${politician.trunchiate}`,
                `Imposibil verificat: ${politician.imposibilDeVerificat}`
              ];
            }
          }
        }
      }
    }
  });
}

function generatePartyChart() {
  const partyStats = {};
  const dataToUse = filteredData.length > 0 ? filteredData : politiciansData;
  dataToUse.forEach(p => {
    if (!partyStats[p.afiliere]) {
      partyStats[p.afiliere] = { count: 0, totalCredibility: 0 };
    }
    partyStats[p.afiliere].count++;
    partyStats[p.afiliere].totalCredibility += p.credibilitate;
  });

  // Get all parties sorted by count
  const chartPartyData = Object.keys(partyStats).map(party => ({
    party,
    avgCredibility: partyStats[party].totalCredibility / partyStats[party].count,
    count: partyStats[party].count
  })).sort((a, b) => b.count - a.count);
  
  // Generate more colors for all parties
  const generateColor = (index) => {
    const hue = (index * 137.508) % 360; // Golden angle approximation
    return `hsl(${hue}, 65%, 55%)`;
  };

  const canvas = document.getElementById('partyChart');
  const ctx = canvas.getContext('2d');

  // Set fixed canvas dimensions to prevent size issues
  canvas.width = 600;
  canvas.height = 400;

  charts.party = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: chartPartyData.map(p => `${p.party} (${p.count})`),
      datasets: [{
        data: chartPartyData.map(p => p.count),
        backgroundColor: chartPartyData.map((_, i) => generateColor(i))
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      onClick: function(event, elements) {
        if (elements.length > 0) {
          const elementIndex = elements[0].index;
          const party = chartPartyData[elementIndex].party;
          document.getElementById('partyFilter').value = party;
          applyFilters();
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 15,
            generateLabels: function (chart) {
              const data = chart.data;
              return data.labels.map((label, i) => {
                const party = chartPartyData[i];
                return {
                  text: `${party.party} (${party.count}) - ${party.avgCredibility.toFixed(1)}%`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].backgroundColor[i],
                  lineWidth: 0,
                  index: i
                };
              });
            },
            filter: function(legendItem, chartData) {
              // Show all items including excluded ones
              return true;
            }
          },
          onClick: function(e, legendItem, legend) {
            // Handle legend clicks to filter by party
            if (legendItem.index >= 0) {
              const party = chartPartyData[legendItem.index].party;
              document.getElementById('partyFilter').value = party;
              applyFilters();
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const party = chartPartyData[context.dataIndex];
              return [
                `Partid: ${party.party}`,
                `Politicieni: ${party.count}`,
                `Credibilitate medie: ${party.avgCredibility.toFixed(1)}%`
              ];
            }
          }
        }
      }
    }
  });
}

function setupFilters() {
  // Populate party filter (all parties are now shown in chart)
  const parties = [...new Set(politiciansData.map(p => p.afiliere))].filter(party => party && party.trim() !== '').sort();
  const partySelect = document.getElementById('partyFilter');
  partySelect.innerHTML = '<option value="">Toate partidele</option>';
  parties.forEach(party => {
    const option = document.createElement('option');
    option.value = party;
    option.textContent = party;
    partySelect.appendChild(option);
  });
  
  // Update chart title based on filter status
  updateChartTitles();
}

function updateChartTitles() {
  // Check if any filters are applied
  const partyFilter = document.getElementById('partyFilter')?.value || '';
  const credibilityFilter = parseFloat(document.getElementById('credibilityFilter')?.value || 0);
  const nameFilter = document.getElementById('nameFilter')?.value?.toLowerCase() || '';
  const minStatementsFilter = parseInt(document.getElementById('minStatementsFilter')?.value || 0);
  
  const isFiltered = partyFilter || credibilityFilter > 0 || nameFilter || minStatementsFilter > 0;
  const partyChartTitle = document.querySelector('.chart-card:nth-child(2) .chart-title');
  
  if (isFiltered) {
    partyChartTitle.innerHTML = 'Distribuția pe partide <span style="font-size: 0.8em; color: #e74c3c; font-weight: bold;">(FILTRAT)</span>';
  } else {
    partyChartTitle.innerHTML = 'Distribuția pe partide <span style="font-size: 0.8em; color: #7f8c8d;">(toate datele)</span>';
  }
}

function applyFilters() {
  const partyFilter = document.getElementById('partyFilter').value;
  const credibilityFilter = parseFloat(document.getElementById('credibilityFilter').value);
  const nameFilter = document.getElementById('nameFilter').value.toLowerCase();
  const minStatementsFilter = parseInt(document.getElementById('minStatementsFilter').value) || 0;

  filteredData = politiciansData.filter(p => {
    if (partyFilter && p.afiliere !== partyFilter) return false;
    if (p.credibilitate < credibilityFilter) return false;
    if (nameFilter && !p.nume.toLowerCase().includes(nameFilter)) return false;
    if (p.numarDeclaratii < minStatementsFilter) return false;
    return true;
  });

  // Update stats and charts (filters only affect these)
  generateStats();

  // Reset pagination for filtered charts
  topPoliticiansCurrentPage = 1;

  // Only regenerate charts if they exist
  if (charts.topPoliticians) {
    charts.topPoliticians.destroy();
  }
  if (charts.party) {
    charts.party.destroy();
  }

  generateTopPoliticiansChart();
  generatePartyChart();
  
  // Update chart titles and party filter (prevent recursive calls)
  if (!isUpdatingFilters) {
    isUpdatingFilters = true;
    updateChartTitles();
    isUpdatingFilters = false;
  }

  // Table is not affected by filters - it shows all data
}

function generateTable() {
  const table = document.getElementById('politiciansTable');
  let sortedData = [...politiciansData];

  // Apply sorting
  sortedData.sort((a, b) => {
    let aVal = a[sortColumn];
    let bVal = b[sortColumn];

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  // Apply pagination
  const totalPages = rowsPerPage === 'all' ? 1 : Math.ceil(sortedData.length / rowsPerPage);
  const startIndex = rowsPerPage === 'all' ? 0 : (currentPage - 1) * rowsPerPage;
  const endIndex = rowsPerPage === 'all' ? sortedData.length : startIndex + rowsPerPage;
  const currentPageData = sortedData.slice(startIndex, endIndex);

  // Update pagination and result count
  updateTablePagination(totalPages);
  document.getElementById('resultCount').textContent = `(${sortedData.length} politicieni)`;

  table.innerHTML = `
                <thead>
                    <tr>
                        <th onclick="sortTable('nume')" style="cursor: pointer;" title="Numele politicianului">Nume<br><span class="sort-icon">${getSortIcon('nume')}</span></th>
                        <th onclick="sortTable('afiliere')" style="cursor: pointer;" title="Partidul politic de afiliere">Partid<br><span class="sort-icon">${getSortIcon('afiliere')}</span></th>
                        <th onclick="sortTable('credibilitate')" style="cursor: pointer;" title="Procentul de credibilitate bazat pe declarațiile verificate">Credibilitate<br><span class="sort-icon">${getSortIcon('credibilitate')}</span></th>
                        <th onclick="sortTable('numarDeclaratii')" style="cursor: pointer;" title="Numărul total de declarații verificate">Total<br>declarații<br><span class="sort-icon">${getSortIcon('numarDeclaratii')}</span></th>
                        <th onclick="sortTable('adevarate')" style="cursor: pointer;" title="Numărul de declarații complet adevărate">Adevărate<br><span class="sort-icon">${getSortIcon('adevarate')}</span></th>
                        <th onclick="sortTable('partialAdevarate')" style="cursor: pointer;" title="Numărul de declarații parțial adevărate">Parțial<br>adevărate<br><span class="sort-icon">${getSortIcon('partialAdevarate')}</span></th>
                        <th onclick="sortTable('trunchiate')" style="cursor: pointer;" title="Numărul de declarații trunchiate sau scoase din context">Trunchiate<br><span class="sort-icon">${getSortIcon('trunchiate')}</span></th>
                        <th onclick="sortTable('false')" style="cursor: pointer;" title="Numărul de declarații false">False<br><span class="sort-icon">${getSortIcon('false')}</span></th>
                        <th onclick="sortTable('imposibilDeVerificat')" style="cursor: pointer;" title="Numărul de declarații imposibil de verificat">Imposibil<br>verificat<br><span class="sort-icon">${getSortIcon('imposibilDeVerificat')}</span></th>
                    </tr>
                </thead>
                <tbody>
                    ${currentPageData.map(p => `
                        <tr>
                            <td><strong>${p.nume}</strong></td>
                            <td>${p.afiliere}</td>
                            <td>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="font-weight: bold;">${p.credibilitate.toFixed(1)}%</span>
                                    <div class="credibility-bar" style="flex: 1;">
                                        <div class="credibility-fill" style="width: ${p.credibilitate}%; background-color: ${getCredibilityColor(p.credibilitate)}"></div>
                                    </div>
                                </div>
                            </td>
                            <td>${p.numarDeclaratii}</td>
                            <td class="true-statements-cell">${p.adevarate}</td>
                            <td class="partial-true-cell">${p.partialAdevarate}</td>
                            <td class="truncated-cell">${p.trunchiate}</td>
                            <td class="false-statements-cell">${p.false}</td>
                            <td class="unverifiable-cell">${p.imposibilDeVerificat}</td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
}

function sortTable(column) {
  if (sortColumn === column) {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn = column;
    sortDirection = 'desc';
  }
  currentPage = 1;
  generateTable();
}

function getSortIcon(column) {
  if (sortColumn !== column) return '↕️';
  return sortDirection === 'asc' ? '⬆️' : '⬇️';
}

function getCredibilityColor(credibility) {
  // Convert credibility (0-100) to a color from dark red to dark green
  if (credibility >= 90) {
    // 90-100%: Dark green to very dark green
    const intensity = 0.2 + (credibility - 90) / 10 * 0.3; // 0.2 to 0.5
    return `hsl(120, 70%, ${20 + intensity * 20}%)`; // Dark green range
  } else if (credibility >= 70) {
    // 70-90%: Light green to dark green
    const intensity = (credibility - 70) / 20; // 0 to 1
    return `hsl(120, 70%, ${45 - intensity * 15}%)`; // Light to dark green
  } else if (credibility >= 50) {
    // 50-70%: Yellow-green to light green
    const intensity = (credibility - 50) / 20; // 0 to 1
    return `hsl(${100 + intensity * 20}, 70%, 50%)`; // Yellow-green to green
  } else if (credibility >= 30) {
    // 30-50%: Orange to yellow
    const intensity = (credibility - 30) / 20; // 0 to 1
    return `hsl(${30 + intensity * 30}, 70%, 50%)`; // Orange to yellow
  } else {
    // 0-30%: Dark red to light red
    const intensity = credibility / 30; // 0 to 1
    return `hsl(0, 70%, ${25 + intensity * 25}%)`; // Dark red to light red
  }
}

function updateTopPoliticiansPagination(totalPages) {
  const pagination = document.getElementById('topPoliticiansPagination');
  let paginationHTML = '';

  if (totalPages > 1) {
    // First page button
    if (topPoliticiansCurrentPage > 1) {
      paginationHTML += `<button onclick="changeTopPoliticiansPage(1)" style="padding: 3px 6px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 3px; font-size: 11px; min-width: 24px;">⟪</button>`;
    }

    // Previous button
    if (topPoliticiansCurrentPage > 1) {
      paginationHTML += `<button onclick="changeTopPoliticiansPage(${topPoliticiansCurrentPage - 1})" style="padding: 3px 6px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 3px; font-size: 11px; min-width: 24px;">‹</button>`;
    }

    // Page numbers (show max 5 pages)
    let startPage = Math.max(1, topPoliticiansCurrentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    if (startPage > 1) {
      paginationHTML += `<span style="padding: 5px; font-size: 12px; color: #7f8c8d;">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
      if (i === topPoliticiansCurrentPage) {
        paginationHTML += `<button style="padding: 3px 6px; border: 1px solid #3498db; background: #3498db; color: white; border-radius: 3px; font-size: 11px; font-weight: bold; min-width: 24px;">${i}</button>`;
      } else {
        paginationHTML += `<button onclick="changeTopPoliticiansPage(${i})" style="padding: 3px 6px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 3px; font-size: 11px; min-width: 24px;">${i}</button>`;
      }
    }

    if (endPage < totalPages) {
      paginationHTML += `<span style="padding: 5px; font-size: 12px; color: #7f8c8d;">...</span>`;
    }

    // Next button
    if (topPoliticiansCurrentPage < totalPages) {
      paginationHTML += `<button onclick="changeTopPoliticiansPage(${topPoliticiansCurrentPage + 1})" style="padding: 3px 6px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 3px; font-size: 11px; min-width: 24px;">›</button>`;
    }

    // Last page button
    if (topPoliticiansCurrentPage < totalPages) {
      paginationHTML += `<button onclick="changeTopPoliticiansPage(${totalPages})" style="padding: 3px 6px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 3px; font-size: 11px; min-width: 24px;">⟫</button>`;
    }
  }

  pagination.innerHTML = paginationHTML;
}

function updateTablePagination(totalPages) {
  const pagination = document.getElementById('pagination');
  let paginationHTML = '';

  if (totalPages > 1) {
    // Previous button
    if (currentPage > 1) {
      paginationHTML += `<button onclick="changeTablePage(${currentPage - 1})" style="padding: 5px 10px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px;">‹</button>`;
    }

    // Page numbers (show max 5 pages)
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    if (startPage > 1) {
      paginationHTML += `<button onclick="changeTablePage(1)" style="padding: 5px 10px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px;">1</button>`;
      if (startPage > 2) {
        paginationHTML += `<span style="padding: 5px;">...</span>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      if (i === currentPage) {
        paginationHTML += `<button style="padding: 5px 10px; border: 1px solid #3498db; background: #3498db; color: white; border-radius: 4px;">${i}</button>`;
      } else {
        paginationHTML += `<button onclick="changeTablePage(${i})" style="padding: 5px 10px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px;">${i}</button>`;
      }
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationHTML += `<span style="padding: 5px;">...</span>`;
      }
      paginationHTML += `<button onclick="changeTablePage(${totalPages})" style="padding: 5px 10px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px;">${totalPages}</button>`;
    }

    // Next button
    if (currentPage < totalPages) {
      paginationHTML += `<button onclick="changeTablePage(${currentPage + 1})" style="padding: 5px 10px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px;">›</button>`;
    }
  }

  pagination.innerHTML = paginationHTML;
}

function changeTopPoliticiansPage(page) {
  topPoliticiansCurrentPage = page;
  if (charts.topPoliticians) {
    charts.topPoliticians.destroy();
  }
  generateTopPoliticiansChart();
}

function changeTablePage(page) {
  currentPage = page;
  generateTable();
}