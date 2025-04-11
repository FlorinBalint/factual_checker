import re
import logging
from pyquery import PyQuery

class PartyExtractor:
  __pattern = re.compile(r'(Afiliere Politică: )'
    r'([Ff]ost )?(membru|[Pp]artidul|[Dd]eputat|[Ss]enator|[Ee]uroparlamentar|(Vice)?[pP]reședinte)?'
    r'(?P<party>(?:[^,\(]*)+)'
  )

  __synonyms = {
    'USR- PLUS': 'USR-PLUS',
    'USR PLUS': 'USR-PLUS',
    'neafiliat': 'Independent',
    'independent': 'Independent',
    'Neafiliat': 'Independent',
  }

  def __init__(self, override=None):
    self.override = override

  def extract_party(self, page_doc):
    if self.override:
      return self.override
    
    if not page_doc:
      return "Independent"
    
    description = page_doc('.afilierepolitica')
    if not description:
      logging.warning('No description found on page')
      return "Independent"
        
    items = list(description.items())
    if not items or len(items) == 0:
      logging.warning('No items found in description')
      return "Independent"

    affiliate_text = items[0].text()
    match = PartyExtractor.__pattern.search(affiliate_text)
    res = None
    if match:
      res = match.group('party').strip()
    else:
      logging.warning(f'No party found for description: {affiliate_text}')
      res = "Independent"

    if res in PartyExtractor.__synonyms:
      res = PartyExtractor.__synonyms[res]
    
    return res
    

