class Issue < ActiveRecord::Base
  
  has_and_belongs_to_many :petitions
  
  structure do
    name            "Firearms"
    petitions_count 3432
    timestamps
  end
  
  after_commit do
    # update petitions counter cache
    petitions_count = petitions.count
  end
  
  def to_param
    "#{id}-#{name.parameterize}"
  end
  
  def petition_time_series
    h = petitions.count(:group => "DATE(created_at)")
    h.keys.each do |key|
      h[Date.parse(key).to_time.to_i] = h.delete(key)
    end
    h.to_a
  end
  
end