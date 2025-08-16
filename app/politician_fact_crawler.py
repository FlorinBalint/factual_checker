import requests
import logging
import time
import random
from pyquery import PyQuery as pq
from politician_stats import PoliticianStats 
from party_extractor import PartyExtractor

logger = logging.getLogger(__name__)

class PoliticianFactsCrawler:
    __browser_headers = [
        {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'},
        {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'},
        {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'},
        {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0'},
        {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0'}
    ]
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

    def parse_facts(self):
      logger.debug('Querying URL: ' + self.link)
      
      # Add rate limiting and random delays
      time.sleep(random.uniform(1, 3))
      
      # Rotate user agents
      headers = random.choice(PoliticianFactsCrawler.__browser_headers)
      
      # Add session with retry logic
      session = requests.Session()
      session.headers.update(headers)
      
      try:
        response = session.get(self.link, timeout=30)
        response.raise_for_status()
      except requests.exceptions.RequestException as e:
        logger.error(f'Failed to fetch {self.link}: {e}')
        return None
      doc = pq(response.text)
      statements = list(doc('span.statement-value-text').items())

      truth_st = 0
      false_st = 0
      partially_true_st = 0
      truncated_st = 0
      impossible_to_check_st = 0

      for statement in statements:
        if statement.text() in PoliticianFactsCrawler.__truth_statement_values:
          truth_st += 1
        elif statement.text() in PoliticianFactsCrawler.__false_statement_values:
          false_st += 1
        elif statement.text() in PoliticianFactsCrawler.__partially_true_statement_values:
          partially_true_st += 1
        elif statement.text() in PoliticianFactsCrawler.__truncated_statement_values:
          truncated_st += 1
        elif statement.text() in PoliticianFactsCrawler.__impossible_to_check_values:
          impossible_to_check_st += 1
        else:
          logger.warning(f'Unknown statement value {statement.text()} for politician {self.name}')

      party = PartyExtractor(self.party).extract_party(doc)
      res = PoliticianStats(self.name, party, impossible_to_check_st, false_st, truncated_st, partially_true_st, truth_st)
      logger.debug('Found stats for politician %s with %d: %s' % (self.name, len(statements), str(res)))
      return res
