import csv

class CsvPrinter:
    __file_header = ['Nume', 'Afiliere', 'Pagina', 'Credibilitate', 'Număr declarații', 'Imposibil de verificat', 'False', 'Trunchiate', 'Parțial adevărate', 'Adevărate']

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
                     politician_stat.url,
                     f'{round(politician_stat.credibility, 2)}%',
                     politician_stat.total,
                     politician_stat.impossible_to_check_count,
                     politician_stat.false_count,
                     politician_stat.truncated_count,
                     politician_stat.partially_true_count,
                     politician_stat.true_count)
          writer.writerow(new_row)
    
    def print_party_stats(self, party_stats):
       with   open(self.file_name, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['Partid', 
                         'Număr total declarații',
                         'Credibilitate medie declarație',
                         'Număr persoane',
                         'Credibilitate medie membru',
                         'Imposibil de verificat', 'False', 'Trunchiate', 'Parțial adevărate', 'Adevărate'])
        
        party_stats.sort(
          key=lambda x: (x.statement_credibility, x.politician_credibility, x.total_count), reverse=True
        )
        for party_stat in party_stats:
          new_row = (party_stat.name, 
                    party_stat.total_count,
                    f'{round(party_stat.statement_credibility, 2)}%',
                    party_stat.total_politician_count,
                    f'{round(party_stat.politician_credibility, 2)}%',
                    party_stat.impossible_to_check_count,
                    party_stat.false_count,
                    party_stat.truncated_count,
                    party_stat.partially_true_count,
                    party_stat.true_count)
          writer.writerow(new_row)
