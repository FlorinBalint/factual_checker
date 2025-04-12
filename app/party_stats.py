
class PartyStats:
  __false_weight = 0
  __truncated_weight = 25
  __partially_true_weight = 75
  __true_weight = 100

  def __sum_array(self, array):
    sum = 0
    for i in array:
      sum += i
    return sum

  def __init__(self, name, politician_stats):
    self.name = name
    self.impossible_to_check_count = self.__sum_array(stat.impossible_to_check_count for stat in politician_stats)
    self.false_count = self.__sum_array(stat.false_count for stat in politician_stats)
    self.truncated_count = self.__sum_array(stat.truncated_count for stat in politician_stats)
    self.partially_true_count = self.__sum_array(stat.partially_true_count for stat in politician_stats)
    self.true_count = self.__sum_array(stat.true_count for stat in politician_stats)
    self.total_politician_count = len(politician_stats)
    self.total_count = (
      self.impossible_to_check_count +
      self.false_count +
      self.truncated_count +
      self.partially_true_count +
      self.true_count
    )
    sum = 0
    if self.total_count > self.impossible_to_check_count:
      sum = self.false_count * PartyStats.__false_weight
      sum += self.truncated_count * PartyStats.__truncated_weight
      sum += self.partially_true_count * PartyStats.__partially_true_weight
      sum += self.true_count * PartyStats.__true_weight
      self.statement_credibility = 1.0 * sum / (self.total_count - self.impossible_to_check_count)
    else:
      self.statement_credibility = 0

    sum_credibility = 0
    count = 0
    for stat in politician_stats:
      if stat.total > stat.impossible_to_check_count:
        sum_credibility += stat.credibility
        count += 1

    if count > 0:
      self.politician_credibility = 1.0 * sum_credibility / count
    else: 
      self.politician_credibility = 0
  
  def __str__(self):
    return "Partid: %s, Număr persoane: %d, Credibilitate medie politician: %.2f, Credibilitate medie declarație: %.2f, Număr total declarații: %s, Imposibil de verificat %s, False: %s, Trunchiate: %s, Parțial adevărate: %s, Adevărate: %s" % (
                                                                                                                            self.name,
                                                                                                                            self.total_politician_count,
                                                                                                                            self.politician_credibility,
                                                                                                                            self.statement_credibility,
                                                                                                                            self.total_count,
                                                                                                                            self.impossible_to_check_count,
                                                                                                                            self.false_count,
                                                                                                                            self.truncated_count,
                                                                                                                            self.partially_true_count,
                                                                                                                            self.true_count)




    
  