from politicians_crawler import PoliticiansCrawler
from politician_fact_crawler import PoliticianFactsCrawler
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
__parser.add_argument('-d', '--debug',
                    type=bool,
                    help='Change the log level to debug',
                    default=False)
__parser.add_argument('-w', '--workers', type=int, 
                    help='The number of processes to use for crawling',
                    default=5)

def crawl_politician(politician):
    """
    Crawl the politician's facts and return the statistics.
    """
    pFactsCrawler = PoliticianFactsCrawler(politician[0], politician[1])
    return pFactsCrawler.parse_facts()

if __name__ == "__main__":
    args = __parser.parse_args()
    # This sets the root logger to write to stdout (your console).
    # Your script/app needs to call this somewhere at least once.
    if args.debug:
      logging.basicConfig(level=logging.DEBUG)
    else:
      logging.basicConfig(level=logging.INFO)

    output_file = args.output if args.output else 'politician_stats.csv'
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

    # Print the results
    logging.debug('Found non empty stats for %d politicians' % len(stats))
    CsvPrinter(output_file).print_politicians(stats)

    