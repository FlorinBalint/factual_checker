
from politician_fact_crawler import PoliticianFactsCrawler
from stats_printer import CsvPrinter
import argparse

__parser = argparse.ArgumentParser(
    prog='Factual Checker',
    description='Check the factual statements of a politician')
__all_politicians = [
    'Klaus Iohannis', 'Kelemen Hunor', 'Victor Ponta',
    'Marcel Ciolacu', 'Mircea Geoană', 'Elena Lasconi',
    'Nicușor Dan', 'Ilie Bolojan', 'Cătălin Drulă',
    'Dan Barna', 'Dacian Cioloș',
    'Anamaria Gavrilă','Cristian Terheș', 
    'Nicolae Ciucă', 'Sebastian Burduja',
    'George Simion', 'Diana Iovanovici-Șoșoacă']
__all_politicians_str = ','.join(__all_politicians)

if __name__ == "__main__":
    __parser.add_argument('-p', '--politicians', 
                        type=str,
                        help='The name of the politicians to check, separated by comma',
                        default=__all_politicians_str)
    args = __parser.parse_args()

    politicians = args.politicians.split(',')
    stats = []
    for politician in politicians:
        pol_stats = PoliticianFactsCrawler(politician.strip()).parse_facts()
        stats.append(pol_stats)

    CsvPrinter('politician_stats.csv').print_politicians(stats)

    