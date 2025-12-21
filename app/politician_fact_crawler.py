import logging
import time
import random
from pyquery import PyQuery as pq
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.chrome.options import Options
from politician_stats import PoliticianStats
from party_extractor import PartyExtractor

logger = logging.getLogger(__name__)

class PoliticianFactsCrawler:
    __fact_url = "https://www.factual.ro/persoane/%s/"
    __truth_statement_values = {'Adevărat', 'În mandat'}
    __false_statement_values = {'Fals', 'În afara mandatului'}
    __partially_true_statement_values = {'Parțial Adevărat', 'Numai cu sprijin instituțional'}
    __truncated_statement_values = {'Trunchiat', 'Parțial Fals'}
    __impossible_to_check_values = {'Imposibil de verificat'}

    def __init__(self, name, link=None, party=None):
        self.name = name
        self.party = party
        if link is None:
            self.link = self.__get_legacy_url()
        else:
            self.link = link

    def __get_legacy_url(self):
        url_suffix = self.name.lower().replace(' ', '-')
        url_suffix = url_suffix.replace('ș', 's')
        url_suffix = url_suffix.replace('ă', 'a')
        url_suffix = url_suffix.replace('â', 'a')
        url_suffix = url_suffix.replace('ț', 't')
        url_suffix = url_suffix.replace('î', 'i')
        url_suffix = url_suffix.replace('á', 'a')

        return PoliticianFactsCrawler.__fact_url % url_suffix

    def _create_driver(self):
        """Create a headless Chrome driver with appropriate options"""
        chrome_options = Options()
        chrome_options.add_argument('--headless=new')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--disable-software-rasterizer')

        # Add stability options
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_experimental_option('excludeSwitches', ['enable-logging'])
        chrome_options.page_load_strategy = 'normal'

        # Random user agent
        user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
        chrome_options.add_argument(f'user-agent={random.choice(user_agents)}')

        # Let Selenium Manager handle the browser and driver detection
        driver = webdriver.Chrome(options=chrome_options)
        driver.set_page_load_timeout(30)
        return driver

    def parse_facts(self):
      logger.debug('Querying URL: ' + self.link)

      driver = None
      try:
        driver = self._create_driver()
        driver.get(self.link)

        # Wait for initial content to load
        wait = WebDriverWait(driver, 10)
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, 'img.barometru-label')))

        # Click "Load More" button until all statements are loaded
        max_clicks = 100  # Safety limit to prevent infinite loops
        clicks = 0

        while clicks < max_clicks:
            try:
                # Look for the "ÎNCARCĂ MAI MULTE" span element with the correct class
                load_more_button = driver.find_element(By.CSS_SELECTOR, 'span.ultp-loadmore-action')

                # Check if button is visible
                if load_more_button.is_displayed():
                    # Get current page number before clicking
                    current_page = load_more_button.get_attribute('data-pagenum')
                    total_pages = load_more_button.get_attribute('data-pages')

                    # Scroll to button to ensure it's in viewport
                    driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", load_more_button)
                    time.sleep(random.uniform(0.5, 1.5))

                    # Click the button using JavaScript (more reliable for custom elements)
                    driver.execute_script("arguments[0].click();", load_more_button)
                    logger.debug(f'Clicked "Load More" for {self.name} (page {current_page}/{total_pages}, click #{clicks + 1})')

                    # Wait for new content to load
                    time.sleep(random.uniform(2, 4))
                    clicks += 1
                else:
                    logger.debug(f'Load More button not visible for {self.name}')
                    break

            except (NoSuchElementException, TimeoutException):
                logger.debug(f'No more "Load More" button found for {self.name} - all statements loaded')
                break

        # Get the final page HTML
        page_html = driver.page_source
        doc = pq(page_html)
        statements = list(doc('img.barometru-label').items())

        truth_st = 0
        false_st = 0
        partially_true_st = 0
        truncated_st = 0
        impossible_to_check_st = 0

        for statement in statements:
          statement_text = statement.attr('title').strip()
          if statement_text in PoliticianFactsCrawler.__truth_statement_values:
            truth_st += 1
          elif statement_text in PoliticianFactsCrawler.__false_statement_values:
            false_st += 1
          elif statement_text in PoliticianFactsCrawler.__partially_true_statement_values:
            partially_true_st += 1
          elif statement_text in PoliticianFactsCrawler.__truncated_statement_values:
            truncated_st += 1
          elif statement_text in PoliticianFactsCrawler.__impossible_to_check_values:
            impossible_to_check_st += 1
          else:
            logger.warning(f'Unknown statement value {statement.text()} for politician {self.name}')

        party = PartyExtractor(self.party).extract_party(doc)
        res = PoliticianStats(
           name= self.name,
           url=self.link,
           affiliation=party,
           truncated_count=truncated_st // 2, # Each statement is counted twice
           true_count=truth_st // 2,
           partially_true_count=partially_true_st // 2,
           impossible_to_check_count=impossible_to_check_st // 2,
           false_count=false_st // 2)
        logger.debug('Found stats for politician %s with %d: %s' % (self.name, len(statements), str(res)))
        return res

      except Exception as e:
        logger.error(f'Failed to fetch {self.link}: {e}')
        return None
      finally:
        if driver:
          try:
            driver.quit()
          except Exception as quit_error:
            logger.debug(f'Error while closing driver: {quit_error}')
