import requests
import logging
import time
import random
from pyquery import PyQuery as pq

logger = logging.getLogger(__name__)

class PoliticiansCrawler:
    __browser_headers = [
        {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'},
        {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'},
        {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'},
        {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0'},
        {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0'}
    ]
    __root_url = "https://www.factual.ro/politicieni/"

    def __init__(self, skip_politicians):
        self.skip_politicians = skip_politicians

    def find_politicians(self):
        logger.debug('Querying for politicians at ' + PoliticiansCrawler.__root_url)
        
        # Add rate limiting
        time.sleep(random.uniform(1, 3))
        
        # Rotate user agents
        headers = random.choice(PoliticiansCrawler.__browser_headers)
        
        # Get the page with the politicians
        session = requests.Session()
        session.headers.update(headers)
        
        try:
            response = session.get(PoliticiansCrawler.__root_url, timeout=30)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            logger.error(f'Failed to fetch politicians list: {e}')
            return []
        doc = pq(response.text)
        # Get the politicians list
        people = doc('a.people-item').items()

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