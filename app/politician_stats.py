
class PoliticianStats:
    __false_weight = 0
    __truncated_weight = 25
    __partially_true_weight = 75
    __true_weight = 100

    def __init__(self, name, url, affiliation, impossible_to_check_count, false_count, truncated_count, partially_true_count, true_count):
        self.name = name
        self.url = url
        self.affiliation = affiliation
        self.false_count = false_count
        self.truncated_count = truncated_count
        self.partially_true_count = partially_true_count
        self.true_count = true_count
        self.impossible_to_check_count = impossible_to_check_count
        self.total = false_count + truncated_count + partially_true_count + true_count + impossible_to_check_count
        if self.total > self.impossible_to_check_count:
          sum = self.false_count * PoliticianStats.__false_weight 
          sum = sum + self.truncated_count * PoliticianStats.__truncated_weight
          sum = sum + self.partially_true_count * PoliticianStats.__partially_true_weight 
          sum = sum + self.true_count * PoliticianStats.__true_weight
          self.credibility = 1.0 * sum / (self.total - self.impossible_to_check_count)
        else:
          self.credibility = 0

    def to_tuple(self):
        return (self.credibility, self.total, self.impossible_to_check_count, self.false_count, self.truncated_count, self.partially_true_count, self.true_count)

    def __str__(self):
        return "Nume: %s, Pagina: %s, Afiliere %s, Credibilitate: %.2f, Număr declarații: %s, Imposibil de verificat %s, False: %s, Trunchiate: %s, Parțial adevărate: %s, Adevărate: %s" % (
                                                                                                                                            self.name,
                                                                                                                                            self.affiliation,
                                                                                                                                            self.credibility,
                                                                                                                                            self.total,
                                                                                                                                            self.impossible_to_check_count,
                                                                                                                                            self.false_count,
                                                                                                                                            self.truncated_count,
                                                                                                                                            self.partially_true_count,
                                                                                                                                            self.true_count)
