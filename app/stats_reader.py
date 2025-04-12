import csv
import logging
from politician_stats import PoliticianStats

logger = logging.getLogger(__name__)

class CsvReader:
  __name_column = 'Nume'
  __affiliation_column = 'Afiliere'
  __impossible_to_check_column = 'Imposibil de verificat'
  __false_count_column = 'False'
  __truncated_count_column = 'Trunchiate'
  __partially_true_count_column = 'Parțial adevărate'
  __true_count_column = 'Adevărate'

  def __init__(self, file_path):
    self.file_path = file_path

  def read_politician_stats(self):
    stats = []
    try:
      with open(self.file_path, mode='r') as file:
        reader = csv.DictReader(file)

        for row in reader:
          stats.append(PoliticianStats(
            name=row.get(CsvReader.__name_column, ''),
            affiliation=row.get(CsvReader.__affiliation_column, ''),
            impossible_to_check_count=int(row.get(CsvReader.__impossible_to_check_column, '0')),
            false_count=int(row.get(CsvReader.__false_count_column, '0')),
            truncated_count=int(row.get(CsvReader.__truncated_count_column, '0')),
            partially_true_count=int(row.get(CsvReader.__partially_true_count_column, '0')),
            true_count=int(row.get(CsvReader.__true_count_column, '0'))
          ))
    except FileNotFoundError:
      logger.error(f"Error: File not found at {self.file_path}")
    except Exception as e:
      logger.error(f"An error occurred while parsing: {e}")
    return stats
