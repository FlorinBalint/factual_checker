import csv

class CsvPrinter:
    __file_header = ['Nume', 'Afiliere', 'Credibilitate', 'Număr declarații', 'Imposibil de verificat', 'False', 'Trunchiate', 'Parțial adevărate', 'Adevărate']

    def __init__(self, file_name):
        self.file_name = file_name

    def print_politicians(self, politician_stats):
      with open(self.file_name, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(CsvPrinter.__file_header)
        politician_stats.sort(
            key=lambda x: (x.credibility, x.total), reverse=True
        )   
        for politician_stat in politician_stats:
          new_row = (politician_stat.name, 
                     politician_stat.affiliation if politician_stat.affiliation else '',
                     f'{round(politician_stat.credibility, 2)}%',
                     politician_stat.total,
                     politician_stat.impossible_to_check_count,
                     politician_stat.false_count,
                     politician_stat.truncated_count,
                     politician_stat.partially_true_count,
                     politician_stat.true_count)
          writer.writerow(new_row)
        