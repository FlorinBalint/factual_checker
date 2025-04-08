import requests
import logging
from pyquery import PyQuery as pq

class PoliticiansCrawler:
    __browser_headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'}
    __root_url = "https://www.factual.ro/politicieni//"

    def __init__(self, skip_politicians):
        self.skip_politicians = skip_politicians

    def find_politicians(self):
        logging.debug('Querying for politicians at ' + PoliticiansCrawler.__root_url)
        # Get the page with the politicians
        response = requests.get(PoliticiansCrawler.__root_url, headers=PoliticiansCrawler.__browser_headers)
        doc = pq(response.text)
        # Get the politicians list
        people = doc('a.people-item').items()

        politicians = []
        for politician in people:
            # Clean up the name
            name = politician.text().strip()
            name = name.split('\n')[0].strip()
            
            link = politician.attr('href')
            logging.debug('Found politician: ' + name + ' at link: ' + link)
            if name in self.skip_politicians:
                continue
            
            politicians.append((name, link))
        logging.debug('Crawled %d politicians' % len(politicians))
        return politicians