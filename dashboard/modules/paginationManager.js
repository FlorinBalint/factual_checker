/**
 * Pagination Management Module
 * Handles pagination controls and navigation
 */
export class PaginationManager {
  constructor() {
    this.currentPage = 1;
    this.itemsPerPage = 50;
    this.topPoliticiansCurrentPage = 1;
    this.topPoliticiansPerPage = 10;
  }

  /**
   * Generate pagination HTML for table
   */
  generateTablePagination(containerId, totalPages, onPageChangeCallback) {
    const container = document.getElementById(containerId);
    let paginationHTML = '';

    if (totalPages > 1) {
      // Previous button
      if (this.currentPage > 1) {
        paginationHTML += `<button onclick="window.changeTablePage(${this.currentPage - 1})" style="padding: 5px 10px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px;">‹</button>`;
      }

      // Page numbers (show max 5 pages)
      let startPage = Math.max(1, this.currentPage - 2);
      let endPage = Math.min(totalPages, startPage + 4);

      if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
      }

      if (startPage > 1) {
        paginationHTML += `<button onclick="window.changeTablePage(1)" style="padding: 5px 10px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px;">1</button>`;
        if (startPage > 2) {
          paginationHTML += `<span style="padding: 5px;">...</span>`;
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        if (i === this.currentPage) {
          paginationHTML += `<button style="padding: 5px 10px; border: 1px solid #3498db; background: #3498db; color: white; border-radius: 4px;">${i}</button>`;
        } else {
          paginationHTML += `<button onclick="window.changeTablePage(${i})" style="padding: 5px 10px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px;">${i}</button>`;
        }
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          paginationHTML += `<span style="padding: 5px;">...</span>`;
        }
        paginationHTML += `<button onclick="window.changeTablePage(${totalPages})" style="padding: 5px 10px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px;">${totalPages}</button>`;
      }

      // Next button
      if (this.currentPage < totalPages) {
        paginationHTML += `<button onclick="window.changeTablePage(${this.currentPage + 1})" style="padding: 5px 10px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px;">›</button>`;
      }
    }

    container.innerHTML = paginationHTML;

    // Set up global page change function
    window.changeTablePage = (page) => {
      this.currentPage = page;
      if (onPageChangeCallback) {
        onPageChangeCallback(page);
      }
    };
  }

  /**
   * Generate pagination HTML for top politicians chart
   */
  generateTopPoliticiansPagination(containerId, totalPages, onPageChangeCallback) {
    const container = document.getElementById(containerId);
    let paginationHTML = '';

    if (totalPages > 1) {
      // First page button
      if (this.topPoliticiansCurrentPage > 1) {
        paginationHTML += `<button onclick="window.changeTopPoliticiansPage(1)" style="padding: 3px 6px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 3px; font-size: 11px; min-width: 24px;">⟪</button>`;
      }

      // Previous button
      if (this.topPoliticiansCurrentPage > 1) {
        paginationHTML += `<button onclick="window.changeTopPoliticiansPage(${this.topPoliticiansCurrentPage - 1})" style="padding: 3px 6px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 3px; font-size: 11px; min-width: 24px;">‹</button>`;
      }

      // Page numbers (show max 5 pages)
      let startPage = Math.max(1, this.topPoliticiansCurrentPage - 2);
      let endPage = Math.min(totalPages, startPage + 4);

      if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
      }

      if (startPage > 1) {
        paginationHTML += `<span style="padding: 5px; font-size: 12px; color: #7f8c8d;">...</span>`;
      }

      for (let i = startPage; i <= endPage; i++) {
        if (i === this.topPoliticiansCurrentPage) {
          paginationHTML += `<button style="padding: 3px 6px; border: 1px solid #3498db; background: #3498db; color: white; border-radius: 3px; font-size: 11px; font-weight: bold; min-width: 24px;">${i}</button>`;
        } else {
          paginationHTML += `<button onclick="window.changeTopPoliticiansPage(${i})" style="padding: 3px 6px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 3px; font-size: 11px; min-width: 24px;">${i}</button>`;
        }
      }

      if (endPage < totalPages) {
        paginationHTML += `<span style="padding: 5px; font-size: 12px; color: #7f8c8d;">...</span>`;
      }

      // Next button
      if (this.topPoliticiansCurrentPage < totalPages) {
        paginationHTML += `<button onclick="window.changeTopPoliticiansPage(${this.topPoliticiansCurrentPage + 1})" style="padding: 3px 6px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 3px; font-size: 11px; min-width: 24px;">›</button>`;
      }

      // Last page button
      if (this.topPoliticiansCurrentPage < totalPages) {
        paginationHTML += `<button onclick="window.changeTopPoliticiansPage(${totalPages})" style="padding: 3px 6px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 3px; font-size: 11px; min-width: 24px;">⟫</button>`;
      }
    }

    container.innerHTML = paginationHTML;

    // Set up global page change function
    window.changeTopPoliticiansPage = (page) => {
      this.topPoliticiansCurrentPage = page;
      if (onPageChangeCallback) {
        onPageChangeCallback(page);
      }
    };
  }

  /**
   * Set table pagination settings
   */
  setTablePagination(page, itemsPerPage) {
    this.currentPage = page;
    this.itemsPerPage = itemsPerPage;
  }

  /**
   * Set top politicians pagination settings
   */
  setTopPoliticiansPagination(page, itemsPerPage) {
    this.topPoliticiansCurrentPage = page;
    this.topPoliticiansPerPage = itemsPerPage;
  }

  /**
   * Get table pagination settings
   */
  getTablePagination() {
    return {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage
    };
  }

  /**
   * Get top politicians pagination settings
   */
  getTopPoliticiansPagination() {
    return {
      currentPage: this.topPoliticiansCurrentPage,
      itemsPerPage: this.topPoliticiansPerPage
    };
  }

  /**
   * Reset pagination to first page
   */
  resetTablePagination() {
    this.currentPage = 1;
  }

  /**
   * Reset top politicians pagination to first page
   */
  resetTopPoliticiansPagination() {
    this.topPoliticiansCurrentPage = 1;
  }
}