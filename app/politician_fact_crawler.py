import requests
from pyquery import PyQuery as pq
from politician_stats import PoliticianStats 


class PoliticianFactsCrawler:
    __browser_headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'}
    __fact_url = "https://www.factual.ro/persoane/%s/"

    def __init__(self, name):
        self.name = name
    
    def __get_url(self):
        url_suffix = self.name.lower().replace(' ', '-')
        url_suffix = url_suffix.replace('ș', 's')              
        url_suffix = url_suffix.replace('ă', 'a')
        url_suffix = url_suffix.replace('â', 'a')
        url_suffix = url_suffix.replace('ț', 't')
        url_suffix = url_suffix.replace('î', 'i')

        return PoliticianFactsCrawler.__fact_url % url_suffix

    def parse_facts(self):
      facts_url = self.__get_url()
      print('Querying URL: ' + facts_url)
      response = requests.get(facts_url, headers=PoliticianFactsCrawler.__browser_headers)
      doc = pq(response.text)
      statements = doc('span.statement-value-text').items()

      truth_st = 0
      false_st = 0
      partially_true_st = 0
      truncated_st = 0

      for statement in statements:
        if statement.text() == 'Adevărat':
          truth_st += 1
        elif statement.text() == 'Fals':
          false_st += 1
        elif statement.text() == 'Parțial Adevărat':
          partially_true_st += 1
        elif statement.text() == 'Trunchiat' or statement.text() == 'Parțial Fals':
          truncated_st += 1        
      
      return PoliticianStats(self.name, false_st, truncated_st, partially_true_st, truth_st)
