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

logger = logging.getLogger(__name__)

class PoliticiansCrawler:
    __root_url = "https://www.factual.ro/politicieni/"

    def __init__(self, skip_politicians):
        self.skip_politicians = skip_politicians

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

    def find_politicians(self):
        logger.debug('Querying for politicians at ' + PoliticiansCrawler.__root_url)

        driver = None
        try:
            driver = self._create_driver()
            driver.get(PoliticiansCrawler.__root_url)

            # Wait for initial content to load
            wait = WebDriverWait(driver, 10)
            wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, '.ultp-block-item .ultp-block-title a')))

            # Click "Load More" button until all politicians are loaded
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
                        logger.debug(f'Clicked "Load More" button (page {current_page}/{total_pages}, click #{clicks + 1})')

                        # Wait for new content to load - check for spinner to disappear
                        time.sleep(random.uniform(2, 4))
                        clicks += 1
                    else:
                        logger.debug('Load More button not visible')
                        break

                except (NoSuchElementException, TimeoutException):
                    logger.debug('No more "Load More" button found - all politicians loaded')
                    break

            # Get the final page HTML
            page_html = driver.page_source
            doc = pq(page_html)

            # Get the politicians list
            people = doc('.ultp-block-item .ultp-block-title a').items()

            politicians = []
            for politician in people:
                # Clean up the name
                name = politician.text().strip()
                name = name.split('\n')[0].strip()

                link = politician.attr('href')
                logger.debug('Found politician: ' + name + ' at link: ' + link)
                if name in self.skip_politicians:
                    continue

                politicians.append((name, link))

            logger.debug('Crawled %d politicians' % len(politicians))
            return politicians

        except Exception as e:
            logger.error(f'Failed to fetch politicians list: {e}')
            return []
        finally:
            if driver:
                try:
                    driver.quit()
                except Exception as quit_error:
                    logger.debug(f'Error while closing driver: {quit_error}')