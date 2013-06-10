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
  
  def data
    h = petitions.count(:group => "DATE(created_at)")
    h.keys.sort.each do |key, value|
      new_key = Date.parse(key.to_s).to_time.to_i
      h[new_key] = h.delete(key)
    end
    h.to_a
  end
  
end