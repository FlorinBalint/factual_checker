/**
 * Charts Management Module
 * Handles Chart.js chart creation and updates
 */
export class ChartsManager {
  constructor() {
    this.charts = {};
  }

  /**
   * Generate color for chart elements
   */
  generateColor(index) {
    const hue = (index * 137.508) % 360; // Golden angle approximation
    return `hsl(${hue}, 65%, 55%)`;
  }

  /**
   * Get credibility color based on percentage
   */
  getCredibilityColor(credibility) {
    if (credibility >= 90) {
      const intensity = 0.2 + (credibility - 90) / 10 * 0.3;
      return `hsl(120, 70%, ${20 + intensity * 20}%)`;
    } else if (credibility >= 70) {
      const intensity = (credibility - 70) / 20;
      return `hsl(120, 70%, ${45 - intensity * 15}%)`;
    } else if (credibility >= 50) {
      const intensity = (credibility - 50) / 20;
      return `hsl(${100 + intensity * 20}, 70%, 50%)`;
    } else if (credibility >= 30) {
      const intensity = (credibility - 30) / 20;
      return `hsl(${30 + intensity * 30}, 70%, 50%)`;
    } else {
      const intensity = credibility / 30;
      return `hsl(0, 70%, ${25 + intensity * 25}%)`;
    }
  }

  /**
   * Create or update top politicians chart
   */
  createTopPoliticiansChart(canvasId, data, onFilterCallback) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');

    // Set sensible height limits (adjust for screen size)
    const screenWidth = window.innerWidth;
    const maxHeight = screenWidth < 768 ? 500 : 600;
    const minHeight = screenWidth < 768 ? 300 : 400;
    const calculatedHeight = Math.min(maxHeight, Math.max(minHeight, data.length * 35 + 100));

    // Set fixed height to prevent infinite growth
    canvas.style.height = calculatedHeight + 'px';
    canvas.height = calculatedHeight;

    // Destroy existing chart
    if (this.charts.topPoliticians) {
      this.charts.topPoliticians.destroy();
    }

    this.charts.topPoliticians = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(p => p.nume),
        datasets: [{
          label: 'Credibilitate (%)',
          data: data.map(p => p.credibilitate === 0 ? 0.1 : p.credibilitate),
          backgroundColor: data.map((_, i) => `hsla(${200 + i * 10}, 70%, 60%, 0.8)`),
          borderColor: data.map((_, i) => `hsla(${200 + i * 10}, 70%, 50%, 1)`),
          borderWidth: 2
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: false,
        maintainAspectRatio: false,
        interaction: {
          intersect: true,
          mode: 'nearest'
        },
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
                return data[index].nume;
              },
              label: function (context) {
                const politician = data[context.dataIndex];
                return [
                  `Credibilitate: ${politician.credibilitate.toFixed(1)}%`,
                  `Partid: ${politician.afiliere}`,
                  `Total declarații: ${politician.numarDeclaratii}`,
                  `Adevărate: ${politician.adevarate}`,
                  `Parțial adevărate: ${politician.partialAdevarate}`,
                  `False: ${politician.false}`,
                  `Trunchiate: ${politician.trunchiate}`,
                  `Imposibil verificat: ${politician.imposibilDeVerificat}`,
                  `Declaratii: ${politician.link}`
                ];
              }
            }
          }
        }
      }
    });

    return this.charts.topPoliticians;
  }

  /**
   * Create or update party distribution chart
   */
  createPartyChart(canvasId, partyData, onFilterCallback) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');

    // Set fixed canvas dimensions like before responsive changes
    canvas.width = 600;
    canvas.height = 400;

    // Destroy existing chart
    if (this.charts.party) {
      this.charts.party.destroy();
    }

    this.charts.party = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: partyData.map(p => `${p.party} (${p.count})`),
        datasets: [{
          data: partyData.map(p => p.count),
          backgroundColor: partyData.map((_, i) => this.generateColor(i))
        }]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        onClick: function (event, elements) {
          if (elements.length > 0 && onFilterCallback) {
            const elementIndex = elements[0].index;
            const party = partyData[elementIndex].party;
            onFilterCallback(party);
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
                  const party = partyData[i];
                  return {
                    text: `${party.party} (${party.count}) - ${party.avgCredibility.toFixed(1)}%`,
                    fillStyle: data.datasets[0].backgroundColor[i],
                    strokeStyle: data.datasets[0].backgroundColor[i],
                    lineWidth: 0,
                    index: i
                  };
                });
              },
              filter: function (legendItem, chartData) {
                return true;
              }
            },
            onClick: function (e, legendItem) {
              if (legendItem && legendItem.index >= 0 && onFilterCallback) {
                const party = partyData[legendItem.index].party;
                onFilterCallback(party);
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const party = partyData[context.dataIndex];
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

    return this.charts.party;
  }

  /**
   * Update chart title based on filter status
   */
  updateChartTitle(chartSelector, isFiltered) {
    const titleElement = document.querySelector(chartSelector);
    if (titleElement) {
      if (isFiltered) {
        titleElement.innerHTML = 'Distribuția pe partide <span style="font-size: 0.8em; color: #e74c3c; font-weight: bold;">(FILTRAT)</span>';
      } else {
        titleElement.innerHTML = 'Distribuția pe partide <span style="font-size: 0.8em; color: #7f8c8d;">(toate datele)</span>';
      }
    }
  }

  /**
   * Destroy all charts
   */
  destroyAllCharts() {
    Object.values(this.charts).forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
    this.charts = {};
  }

  /**
   * Get chart instance
   */
  getChart(name) {
    return this.charts[name];
  }
}