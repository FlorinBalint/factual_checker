# Factual Checker

A Python-based web scraper that crawls fact-checking data for Romanian politicians from factual.ro and generates interactive statistics dashboards.

## Overview

This project automatically collects and analyzes fact-checking data for Romanian politicians, generating comprehensive statistics about their credibility based on verified statements. The system crawls data from factual.ro, processes it, and presents it through an interactive web dashboard.

## Data Sources

This project crawls data from factual.ro, a Romanian fact-checking website. The system respects robots.txt and implements ethical scraping practices with rate limiting and appropriate user agents.

## How It Works

The factual checker operates in several phases:

1. **Politicians Discovery**: Crawls factual.ro to discover available politicians or uses a predefined list of renowned politicians
2. **Fact Extraction**: For each politician, scrapes their individual page to extract fact-checking verdicts
3. **Data Processing**: Categorizes statements into: True, False, Partially True, Truncated, and Impossible to Check
4. **Statistics Generation**: Computes individual politician stats and aggregates them by political party
5. **Dashboard Generation**: Creates an interactive HTML dashboard with charts and tables

### Data Categories

The system categorizes fact-checked statements into five types:
- **True**: "Adevărat"
- **False**: "Fals"
- **Partially True**: "Parțial Adevărat", "Numai cu sprijin instituțional"
- **Truncated**: "Trunchiat", "Parțial Fals"
- **Impossible to Check**: "Imposibil de verificat"

## Project Structure

```
factual_checker/
├── app/                          # Core application logic
│   ├── main.py                   # Main entry point with CLI interface
│   ├── politicians_crawler.py    # Discovers politicians from factual.ro
│   ├── politician_fact_crawler.py # Scrapes individual politician facts
│   ├── politician_stats.py       # Data models for politician statistics
│   ├── party_stats.py           # Aggregates stats by political party
│   ├── party_extractor.py       # Extracts party affiliation from pages
│   ├── stats_reader.py          # Reads statistics from CSV files
│   └── stats_printer.py         # Outputs statistics to CSV format
├── dashboard/                    # Interactive web dashboard
│   ├── political_dashboard.html  # Main dashboard interface
│   ├── index.html               # Redirect page
│   ├── main.js                  # Dashboard JavaScript logic
│   ├── dashboard_style.css      # Dashboard styling
│   └── modules/                 # Modular JS components
│       ├── dashboardApp.js      # Main app controller
│       ├── dataManager.js       # Data loading and processing
│       ├── tableManager.js      # Table rendering and sorting
│       ├── chartsManager.js     # Chart generation
│       └── paginationManager.js # Table pagination
├── scripts/                     # Automation and deployment scripts
│   ├── cron_wrapper.sh         # Cron job wrapper
│   ├── setup_cron.sh           # Sets up automated data updates
│   └── update_dashboard_data.sh # Updates dashboard data
├── logs/                       # Application logs
└── requirements.txt            # Python dependencies
```

### Key Components

- **PoliticiansCrawler**: Discovers politicians from the main factual.ro politicians page
- **PoliticianFactsCrawler**: Scrapes individual politician pages for fact-checking data
- **PartyStats**: Aggregates individual politician statistics by political party
- **Dashboard**: Interactive web interface with filtering, sorting, and visualization capabilities

## Local Development Setup

### Prerequisites

- Python 3.6 or higher
- pip package manager
- Modern web browser (for viewing the dashboard)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/FlorinBalint/factual_checker.git
cd factual_checker
```

2. Install dependencies:
```bash
make init
# or alternatively:
pip install -r requirements.txt
```

### Running the Application

#### Basic Usage

```bash
# Crawl all discovered politicians and generate statistics
make poli_stats

# Crawl specific politicians
python3 app/main.py -p "Klaus Iohannis,Marcel Ciolacu"

# Skip certain politicians
python3 app/main.py -s "politician1,politician2"

# Use custom output file
python3 app/main.py -o my_stats.csv

# Enable debug logging
python3 app/main.py -d true

# Use multiple workers for faster crawling
python3 app/main.py -w 10
```

#### Advanced Options

```bash
# Read from existing stats file instead of crawling
python3 app/main.py --stats_file existing_stats.csv

# Disable party statistics generation
python3 app/main.py --generate_party_stats false
```

### Viewing Results

After running the crawler, you'll get:
- `politician_stats.csv`: Individual politician statistics
- `party_politician_stats.csv`: Aggregated party statistics

### Automated Updates

The project includes scripts for setting up automated data updates:

```bash
# Set up cron job for daily updates
./scripts/setup_cron.sh

# Manual data update
./scripts/update_dashboard_data.sh
```

## Configuration

### Politician Override List

The system includes a party override dictionary in `app/main.py` for politicians whose party affiliation cannot be automatically extracted or needs correction.

### Rate Limiting

The crawlers implement respectful rate limiting:
- Random delays between requests (1-3 seconds)
- User agent rotation
- Session management with timeout handling

## Contributing

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes following the existing code style
4. Test your changes locally
5. Submit a pull request

### Development Guidelines

- **Code Style**: Follow existing Python conventions and naming patterns
- **Error Handling**: Implement proper error handling and logging
- **Rate Limiting**: Respect the target website's resources with appropriate delays
- **Documentation**: Update documentation for new features

### Areas for Contribution

- **New Data Sources**: Add support for additional fact-checking websites
- **Enhanced Analytics**: Implement more sophisticated statistical analysis
- **Dashboard Features**: Add new visualization types or interactive features
- **Performance**: Optimize crawling speed while respecting rate limits
- **Data Quality**: Improve party affiliation detection and data cleaning
- **Internationalization**: Add support for other languages/countries

### Reporting Issues

Please report bugs and feature requests through GitHub Issues. Include:
- Detailed description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Python version, OS)
