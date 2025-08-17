/**
 * Table Management Module
 * Handles table generation, sorting, and display
 */
export class TableManager {
  constructor(chartsManager) {
    this.chartsManager = chartsManager;
    this.currentSortColumn = 'credibilitate';
    this.currentSortDirection = 'desc';
  }

  /**
   * Get sort icon for column header
   */
  getSortIcon(column) {
    if (this.currentSortColumn !== column) return '↕️';
    return this.currentSortDirection === 'asc' ? '⬆️' : '⬇️';
  }

  /**
   * Generate table HTML
   */
  generateTable(tableId, data, pagination, onSortCallback) {
    const table = document.getElementById(tableId);
    
    // Update result count
    const resultCountEl = document.getElementById('resultCount');
    if (resultCountEl) {
      resultCountEl.textContent = `(${pagination.totalItems} politicieni)`;
    }

    table.innerHTML = `
      <thead>
        <tr>
          <th onclick="window.tableSort('nume')" style="cursor: pointer;" title="Numele politicianului">
            Nume<br><span class="sort-icon">${this.getSortIcon('nume')}</span>
          </th>
          <th onclick="window.tableSort('afiliere')" style="cursor: pointer;" title="Partidul politic de afiliere">
            Partid<br><span class="sort-icon">${this.getSortIcon('afiliere')}</span>
          </th>
          <th onclick="window.tableSort('credibilitate')" style="cursor: pointer;" title="Procentul de credibilitate bazat pe declarațiile verificate">
            Credibilitate<br><span class="sort-icon">${this.getSortIcon('credibilitate')}</span>
          </th>
          <th onclick="window.tableSort('numarDeclaratii')" style="cursor: pointer;" title="Numărul total de declarații verificate">
            Total<br>declarații<br><span class="sort-icon">${this.getSortIcon('numarDeclaratii')}</span>
          </th>
          <th onclick="window.tableSort('adevarate')" style="cursor: pointer;" title="Numărul de declarații complet adevărate">
            Adevărate<br><span class="sort-icon">${this.getSortIcon('adevarate')}</span>
          </th>
          <th onclick="window.tableSort('partialAdevarate')" style="cursor: pointer;" title="Numărul de declarații parțial adevărate">
            Parțial<br>adevărate<br><span class="sort-icon">${this.getSortIcon('partialAdevarate')}</span>
          </th>
          <th onclick="window.tableSort('trunchiate')" style="cursor: pointer;" title="Numărul de declarații trunchiate sau scoase din context">
            Trunchiate<br><span class="sort-icon">${this.getSortIcon('trunchiate')}</span>
          </th>
          <th onclick="window.tableSort('false')" style="cursor: pointer;" title="Numărul de declarații false">
            False<br><span class="sort-icon">${this.getSortIcon('false')}</span>
          </th>
          <th onclick="window.tableSort('imposibilDeVerificat')" style="cursor: pointer;" title="Numărul de declarații imposibil de verificat">
            Imposibil<br>verificat<br><span class="sort-icon">${this.getSortIcon('imposibilDeVerificat')}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        ${data.map(p => `
          <tr>
            <td><strong>${p.nume}</strong></td>
            <td>${p.afiliere}</td>
            <td>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: bold;">${p.credibilitate.toFixed(1)}%</span>
                <div class="credibility-bar" style="flex: 1;">
                  <div class="credibility-fill" style="width: ${p.credibilitate}%; background-color: ${this.chartsManager.getCredibilityColor(p.credibilitate)}"></div>
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

    // Set up global sort function
    window.tableSort = (column) => {
      if (this.currentSortColumn === column) {
        this.currentSortDirection = this.currentSortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.currentSortColumn = column;
        this.currentSortDirection = 'desc';
      }
      
      if (onSortCallback) {
        onSortCallback(this.currentSortColumn, this.currentSortDirection);
      }
    };
  }

  /**
   * Get current sort settings
   */
  getCurrentSort() {
    return {
      column: this.currentSortColumn,
      direction: this.currentSortDirection
    };
  }

  /**
   * Set sort settings
   */
  setSort(column, direction) {
    this.currentSortColumn = column;
    this.currentSortDirection = direction;
  }
}