from politicians_crawler import PoliticiansCrawler
from politician_fact_crawler import PoliticianFactsCrawler
from party_stats import PartyStats
from stats_reader import CsvReader
from stats_printer import CsvPrinter
import multiprocessing as mp
import argparse
import logging

__renown_politicians = [
    'Klaus Iohannis', 'Kelemen Hunor', 'Victor Ponta',
    'Marcel Ciolacu', 'Mircea Geoană', 'Elena Lasconi',
    'Nicușor Dan', 'Ilie Bolojan', 'Cătălin Drulă',
    'Brigitte Clotilde Armand', 'Cristian Ghinea',
    'Vlad Voiculescu',
    'Traian Băsescu', 'Tudorel Toader', 'Viorica Dăncilă',
    'Mihai Tudose', 'Rareș Bogdan', 'Tánczos Barna',
    'Iulian Bulai', 'Liviu Dragnea', 'Ludovic Orban',
    'Dominic Samuel Fritz', 'Dragoș Pîslaru', 'Ionuț Moșteanu',
    'Florin Cîțu', 'Florin Iordache', 'Gabriela Firea',
    'Ecaterina Andronescu', 'Emil Boc', 'Eugen Teodorovici',
    'Călin Popescu Tăriceanu', 'Cristian Popescu Piedone',
    'Dan Barna', 'Dacian Cioloș', 'Cătălin Predoiu',
    'Anamaria Gavrilă','Cristian Terheș', 'Alexandru Rafila',
    'Nicolae Ciucă', 'Sebastian Burduja', 'Claudiu Năsui',
    'George Simion', 'Diana Iovanovici-Șoșoacă']

__party_override = {
  'Klaus Iohannis': 'PNL',
  'Nicușor Dan': 'USR',
  'Elena Udrea': 'PMP',
  'Marcel Ciolacu': 'PSD',
  'Toni Greblă': 'AEP',
  'Dacian Cioloș': 'REPER',
  'Mihai Lascau': 'AUR',
  'Partidul Social Democrat': 'PSD',
  'PNL': 'PNL',
  'AUR': 'AUR',
  'AUR (Alianța pentru Unirea Românilor)': 'AUR',
  'Primăria Municipiul București': 'Primăria București',
  'Guvernul României': 'Guvern',
  'Ministerul Finanțelor': 'Guvern',
  'Liviu Iolu': 'Guvern',
  'Brigitte Clotilde Armand': 'USR',
  'Ciprian Ciucu': 'PNL',
  'Cristina Palmer': 'Independent',
  'Marcel Vela': 'PNL',
  'Radu Mihail': 'USR',
  'Victor Costache' : 'PNL',
  'Costel Alexe': 'PNL',
  'Alina Gorghiu': 'PNL',
  'Ilan Laufer': 'AUR',
  'Tudorel Toader': 'Independent',
  'Patriciu Achimaș-Cadariu': '',
  'Raluca Prună': 'Independent',
  'Sorina Pintea': 'PSD',
  'Violeta Alexandru': 'USR',
  'Alexandru Athanasiu': 'PSD',
  'Corina Șuteu': 'Independent',
  'Stelian Ion': 'USR',
  'Patriciu Achimaș-Cadariu': 'PSD',
  'Mihai Lasca': 'AUR',
  'Octavian Berceanu': 'REPER',
  'Ioan Cupșa': 'PNL',
  'Gabriela Szabo': 'PSD',
  'Daniel Băluţă': 'PSD',
  'Anca Dragu': 'USR',
  'Adrian Dohotaru': 'PV',
  'Manea- Eusebiu Pistru': 'PSD',
  'Emanuel Ungureanu': 'USR',
  'Tudor Benga': 'USR',
  'Vlad Voiculescu': 'USR',
  'Ioana Mihăilă': 'REPER',
  'Crin Antonescu': 'PNL',
  'Valentin Popa': 'PSD',
  'Mirela Elena Adomnicăi': 'PSD',
  'Ecaterina Andronescu': 'PSD',
  'Anda Diana Buzoianu': 'USR',
  'Ionuț Mișa': 'PSD',
  'Darius Vâlcov': 'PSD',
  'Nicuşor Halici': 'PSD',
  'Vasile Dîncu': 'PSD',
  'Cătălin Rădulescu': 'PER',
  'Ana Birchall': 'PSD',
  'Cristian Popescu Piedone': 'PUSL',
  'Anamaria Gavrilă': 'POT',
  'Ciprian Ciubuc': 'SOS',
  'Adrian-George Axinia': 'AUR',
  'Dumitru Coarnă': 'AUR',
  'Andrei-Cosmin Gușă': 'AUR',
  'Cătălin Cherecheș': 'PSD',
  'Brian Cristian': 'USR',
  'Dragoș Pîslaru': 'REPER',
  'Liviu Iolu': 'REPER',
  'Ştefan Viorel Florescu': 'PMP',
  'Andrei Lupu': 'REPER',
  'Vasilica Miron': 'PNL',
  'Tudor Ciuhodaru': 'AUR',
  'Anton Anton': 'ALDE',
  'Paul Gheorghe': 'PSD',
  'Marius Dorin Lulea': 'AUR',
}

class BooleanAction(argparse.Action):
    def __call__(self, parser, namespace, values, option_string=None):
        if values.lower() in ('yes', 'y', 'true'):
            setattr(namespace, self.dest, True)
        elif values.lower() in ('no', 'n', 'false'):
            setattr(namespace, self.dest, False)
        else:
            raise argparse.ArgumentTypeError(f"Unsupported boolean value: {values}")

__parser = argparse.ArgumentParser(
    prog='Factual Checker',
    description='Check the factual statements of a politician')
__parser.add_argument('-p', '--politicians', 
                        type=str,
                        help='The name of the politicians to check, separated by comma',
                        default=[])
__parser.add_argument('-s', '--skip_list',
                    type=str,
                    help='The name of the politicians to skip, separated by comma',
                    default='')
__parser.add_argument('-o', '--output',
                    type=str,
                    help='The output file name',
                        default='politician_stats.csv')
__parser.add_argument('-d', '--debug', dest='debug',
                    action=BooleanAction,                                        
                    type=str, choices=['yes', 'no', 'true', 'false', 'y', 'n'],
                    help='Change the log level to debug',
                    default='false')
__parser.add_argument('-w', '--workers', type=int, 
                    help='The number of processes to use for crawling',
                    default=5)

__parser.add_argument('--stats_file', type=str,
                    help='An input file with the politician stats.' \
                    'If set, this file will be used to read the stats instead of crawling them.',
                    default=None)
__parser.add_argument('--generate_party_stats', dest='generate_party_stats',
                    action=BooleanAction,
                    type=str, choices=['yes', 'no', 'true', 'false', 'y', 'n'],
                    help='Wether to generate aggregated statistics per party',
                    default='true'
                  )


def crawl_politician(politician):
    """
    Crawl the politician's facts and return the statistics.
    """
    pFactsCrawler = PoliticianFactsCrawler(politician[0], politician[1], __party_override.get(politician[0]))
    return pFactsCrawler.parse_facts()


def crawl_stats(args):
  skip_politicians = set(args.skip_list.split(',')) if args.skip_list else {}
    
  if args.politicians:
    politicians = args.politicians.split(',')
    if len(politicians) == 0:
      politicians = __renown_politicians
    politicians = [(p.strip(), None) for p in politicians if p not in skip_politicians]
  else:
    politicians = PoliticiansCrawler(skip_politicians).find_politicians()

  stats = []
  with mp.Pool(args.workers) as pool:
    async_stats = pool.imap_unordered(crawl_politician, politicians, chunksize=10)
    # Wait for all processes to finish      
    for stat in async_stats:
      if stat is not None and stat.total > 0:
        stats.append(stat)
    
    pool.close()
    pool.join()

  return stats


def main(args):
  # This sets the root logger to write to stdout (your console) and to a file.
  # Create logs directory if it doesn't exist
  import os
  from datetime import datetime

  log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
  os.makedirs(log_dir, exist_ok=True)

  # Create log filename with timestamp
  log_filename = os.path.join(log_dir, f'crawler_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')

  # Configure logging to both file and console
  log_level = logging.DEBUG if args.debug else logging.INFO

  # Remove any existing handlers
  for handler in logging.root.handlers[:]:
    logging.root.removeHandler(handler)

  # Create formatters
  detailed_formatter = logging.Formatter(
    '[%(asctime)s] [%(levelname)s] [%(name)s:%(lineno)d] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
  )
  simple_formatter = logging.Formatter(
    '[%(asctime)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
  )

  # File handler with detailed formatting
  file_handler = logging.FileHandler(log_filename, mode='w')
  file_handler.setLevel(logging.DEBUG)  # Always log DEBUG to file
  file_handler.setFormatter(detailed_formatter)

  # Console handler with simpler formatting
  console_handler = logging.StreamHandler()
  console_handler.setLevel(log_level)
  console_handler.setFormatter(simple_formatter)

  # Configure root logger
  logging.root.setLevel(logging.DEBUG)
  logging.root.addHandler(file_handler)
  logging.root.addHandler(console_handler)

  logging.info(f'Logging to file: {log_filename}')
  logging.info(f'Log level: {"DEBUG" if args.debug else "INFO"}')

  output_file = args.output if args.output else 'politician_stats.csv'
  if args.stats_file:
    logging.debug('Reading stats from file %s' % args.stats_file)
    stats = CsvReader(args.stats_file).read_politician_stats()
  else: 
    stats = crawl_stats(args)

  # Print the results
  logging.debug('Found non empty stats for %d politicians' % len(stats))

  # Print the politicians stats
  CsvPrinter(output_file).print_politicians(stats)

  if not args.generate_party_stats:
    return
  
  # Compute and print the party stats
  party_stats_list = []
  party_stats_dict = {}
  for stat in stats:
    if stat.affiliation.upper() not in party_stats_dict:
      party_stats_dict[stat.affiliation.upper()] = []
    party_stats_dict[stat.affiliation.upper()].append(stat)
  for party, party_stats in party_stats_dict.items():
    party_stats_list.append(PartyStats(party, party_stats))
  CsvPrinter(f'party_{output_file}').print_party_stats(party_stats_list)

if __name__ == "__main__":
    main(__parser.parse_args())
