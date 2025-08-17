/**
 * Main Dashboard Application Module
 * Orchestrates all other modules and handles user interactions
 */
import { DataManager } from './dataManager.js';
import { ChartsManager } from './chartsManager.js';
import { TableManager } from './tableManager.js';
import { PaginationManager } from './paginationManager.js';

export class DashboardApp {
  constructor() {
    this.dataManager = new DataManager();
    this.chartsManager = new ChartsManager();
    this.tableManager = new TableManager(this.chartsManager);
    this.paginationManager = new PaginationManager();
    
    this.isUpdatingFilters = false;
    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      this.showLoading(true);
      this.setupDefaultValues();
      this.setupEventListeners();
      
      // Load data
      await this.dataManager.loadCSVData();
      
      // Setup initial state
      this.setupFilters();
      this.generateDashboard();
      
      this.showLoading(false);
      this.showDashboard(true);
    } catch (error) {
      this.showError('Nu s-au putut încărca datele politicienilor. Vă rugăm să reîncercați mai târziu.');
      this.showLoading(false);
    }
  }

  /**
   * Setup default values for selectors
   */
  setupDefaultValues() {
    document.getElementById('topPoliticiansPerPage').value = '10';
    document.getElementById('rowsPerPage').value = '50';
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Filter events
    document.getElementById('applyFilters').addEventListener('click', () => this.applyFilters());
    
    // Pagination events
    document.getElementById('rowsPerPage').addEventListener('change', (e) => {
      const value = e.target.value;
      this.paginationManager.setTablePagination(1, value === 'all' ? this.dataManager.getAllData().length : parseInt(value));
      this.generateTable();
    });

    document.getElementById('topPoliticiansPerPage').addEventListener('change', (e) => {
      this.paginationManager.setTopPoliticiansPagination(1, parseInt(e.target.value));
      this.generateTopPoliticiansChart();
    });
  }

  /**
   * Setup filter dropdowns
   */
  setupFilters() {
    const parties = this.dataManager.getParties();
    const partySelect = document.getElementById('partyFilter');
    partySelect.innerHTML = '<option value="">Toate partidele</option>';
    
    parties.forEach(party => {
      const option = document.createElement('option');
      option.value = party;
      option.textContent = party;
      partySelect.appendChild(option);
    });
    
    this.updateChartTitles();
  }

  /**
   * Generate statistics grid
   */
  generateStats() {
    const statsGrid = document.getElementById('statsGrid');
    const isFiltered = this.dataManager.getFilteredData().length !== this.dataManager.getAllData().length;
    const stats = this.dataManager.getStatistics(isFiltered);

    statsGrid.innerHTML = `
      <div class="stat-card politicians">
        <div class="stat-value politicians">${stats.totalPoliticians}</div>
        <div class="stat-label">Politicieni ${isFiltered ? 'filtrați' : 'analizați'}</div>
      </div>
      <div class="stat-card credibility-politicians">
        <div class="stat-value credibility-politicians">${stats.avgPoliticianCredibility}%</div>
        <div class="stat-label">Credibilitate medie politicieni</div>
      </div>
      <div class="stat-card credibility-statements">
        <div class="stat-value credibility-statements">${stats.avgStatementCredibility}%</div>
        <div class="stat-label">Credibilitate medie declarații</div>
      </div>
      <div class="stat-card total-statements">
        <div class="stat-value total-statements">${stats.totalStatements.toLocaleString()}</div>
        <div class="stat-label">Total declarații</div>
      </div>
      <div class="stat-card true-statements">
        <div class="stat-value true-statements">${stats.totalTrue.toLocaleString()}</div>
        <div class="stat-label">Declarații adevărate</div>
      </div>
      <div class="stat-card partial-true">
        <div class="stat-value partial-true">${stats.totalPartialTrue.toLocaleString()}</div>
        <div class="stat-label">Parțial adevărate</div>
      </div>
      <div class="stat-card truncated">
        <div class="stat-value truncated">${stats.totalTruncated.toLocaleString()}</div>
        <div class="stat-label">Trunchiate</div>
      </div>
      <div class="stat-card false-statements">
        <div class="stat-value false-statements">${stats.totalFalse.toLocaleString()}</div>
        <div class="stat-label">Declarații false</div>
      </div>
    `;
  }

  /**
   * Generate top politicians chart
   */
  generateTopPoliticiansChart() {
    const pagination = this.paginationManager.getTopPoliticiansPagination();
    const sortedData = this.dataManager.getSortedPoliticians('credibilitate', 'desc', true);
    const paginatedData = this.dataManager.getPaginatedData(sortedData, pagination.currentPage, pagination.itemsPerPage);
    
    // Update pagination
    this.paginationManager.generateTopPoliticiansPagination('topPoliticiansPagination', paginatedData.totalPages, () => {
      this.generateTopPoliticiansChart();
    });

    this.chartsManager.createTopPoliticiansChart('topPoliticiansChart', paginatedData.data);
  }

  /**
   * Generate party chart
   */
  generatePartyChart() {
    const isFiltered = this.dataManager.getFilteredData().length !== this.dataManager.getAllData().length;
    const partyData = this.dataManager.getPartyStatistics(isFiltered);
    
    this.chartsManager.createPartyChart('partyChart', partyData, (party) => {
      document.getElementById('partyFilter').value = party;
      this.applyFilters();
    });
  }

  /**
   * Generate table
   */
  generateTable() {
    const pagination = this.paginationManager.getTablePagination();
    const sort = this.tableManager.getCurrentSort();
    const sortedData = this.dataManager.getSortedPoliticians(sort.column, sort.direction, false);
    const paginatedData = this.dataManager.getPaginatedData(sortedData, pagination.currentPage, pagination.itemsPerPage);
    
    // Update pagination
    this.paginationManager.generateTablePagination('pagination', paginatedData.totalPages, () => {
      this.generateTable();
    });

    this.tableManager.generateTable('politiciansTable', paginatedData.data, paginatedData, (column, direction) => {
      this.paginationManager.resetTablePagination();
      this.generateTable();
    });
  }

  /**
   * Apply filters
   */
  applyFilters() {
    const filters = {
      party: document.getElementById('partyFilter').value,
      credibility: parseFloat(document.getElementById('credibilityFilter').value),
      name: document.getElementById('nameFilter').value,
      minStatements: parseInt(document.getElementById('minStatementsFilter').value) || 0
    };

    this.dataManager.applyFilters(filters);

    // Update stats and charts (filters only affect these)
    this.generateStats();

    // Reset pagination for filtered charts
    this.paginationManager.resetTopPoliticiansPagination();

    this.generateTopPoliticiansChart();
    this.generatePartyChart();
    
    // Update chart titles
    if (!this.isUpdatingFilters) {
      this.isUpdatingFilters = true;
      this.updateChartTitles();
      this.isUpdatingFilters = false;
    }
  }

  /**
   * Update chart titles based on filter status
   */
  updateChartTitles() {
    const partyFilter = document.getElementById('partyFilter')?.value || '';
    const credibilityFilter = parseFloat(document.getElementById('credibilityFilter')?.value || 0);
    const nameFilter = document.getElementById('nameFilter')?.value?.toLowerCase() || '';
    const minStatementsFilter = parseInt(document.getElementById('minStatementsFilter')?.value || 0);
    
    const isFiltered = partyFilter || credibilityFilter > 0 || nameFilter || minStatementsFilter > 0;
    
    this.chartsManager.updateChartTitle('#partyChart', isFiltered);
  }

  /**
   * Generate complete dashboard
   */
  generateDashboard() {
    this.generateStats();
    this.generateTopPoliticiansChart();
    this.generatePartyChart();
    this.generateTable();
    this.updateChartTitles();
  }

  /**
   * Show/hide loading state
   */
  showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
  }

  /**
   * Show/hide dashboard
   */
  showDashboard(show) {
    document.getElementById('dashboard').style.display = show ? 'block' : 'none';
  }

  /**
   * Show error message
   */
  showError(message) {
    const statusZone = document.querySelector('.status-zone');
    if (statusZone) {
      statusZone.innerHTML = `
        <div style="font-size: 1.2em; margin-bottom: 10px;">❌ Eroare la încărcarea datelor</div>
        <div style="font-size: 0.9em; opacity: 0.9;">${message}</div>
      `;
      statusZone.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
    }
  }
}