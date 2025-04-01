
class PoliticianStats:
    __false_weight = 0
    __truncated_weight = 25
    __partially_true_weight = 75
    __true_weight = 100

    def __init__(self, name, false_count, truncated_count, partially_true_count, true_count):
        self.name = name
        self.false_count = false_count
        self.truncated_count = truncated_count
        self.partially_true_count = partially_true_count
        self.true_count = true_count
        self.total = false_count + truncated_count + partially_true_count + true_count
        if self.total > 0:
          sum = self.false_count * PoliticianStats.__false_weight 
          sum = sum + self.truncated_count * PoliticianStats.__truncated_weight
          sum = sum + self.partially_true_count * PoliticianStats.__partially_true_weight 
          sum = sum + self.true_count * PoliticianStats.__true_weight
          self.credibility = 1.0 * sum / self.total
        else:
          self.credibility = 0

    def to_tuple(self):
        return (self.credibility, self.total, self.false_count, self.truncated_count, self.partially_true_count, self.true_count)

    def __str__(self):
        return "Nume: %s, Credibilitate: %.2f %, Număr declarații: %s, False: %s, Trunchiate: %s, Parțial adevărate: %s, Adevărate: %s" % (self.name, 
                                                                                                                                            self.credibility,
                                                                                                                                            self.total,
                                                                                                                                            self.false_count,
                                                                                                                                            self.truncated_count,
                                                                                                                                            self.partially_true_count,
                                                                                                                                            self.true_count)
