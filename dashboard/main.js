/**
 * Main entry point for the Dashboard Application
 * Initializes the modular dashboard when the DOM is loaded
 */
import { DashboardApp } from './modules/dashboardApp.js';

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.dashboardApp = new DashboardApp();
});