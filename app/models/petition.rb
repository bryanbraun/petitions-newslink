class Petition < ActiveRecord::Base
  
  has_and_belongs_to_many :issues
  
  structure do
    identifier      "50cb6d2ba9a0b1c52e000017"
    created_at      Time.now      # created
    updated_at      Time.now
    deadline_at     Time.now      # deadline
    responded_at    Time.now    # response.associationTime
    url             "https://petitions.whitehouse.gov/petition/immediately-address-issue-gun-control-through-introduction-legislation-congress/2tgcXzQC"
    signature_count 92309458
    title           "Blah blah"
  end
  
  validates_uniqueness_of :identifier
  
  scope :order_by_signatures, -> { order('signature_count DESC') }
          
  def responded?
    !!responded_at
  end
    
  def created=(timestamp)
    self.created_at = Time.at(timestamp).utc
  end
  
  def deadline=(timestamp)
    self.deadline_at = Time.at(timestamp).utc
  end
  
  def responded=(timestamp)
    self.responded_at = Time.at(timestamp).utc
  end
  
  def to_param
    "#{identifier}"
  end
    
  def self.update_batch(count=1600, offset=0)
    petitions = WeThePeople::Resources::Petition.all(nil, {count: count, offset: offset})
    petitions.each do |pet|
      next if pet.type != 'petition'
      it = Petition.where(:identifier => pet.id).first_or_create
      it.created = pet.created.to_i
      it.deadline = pet.deadline.to_i
      it.url = pet.url
      it.title = pet.title
      it.signature_count = pet.signature_count
      # TODO: it.responded = pet["response"]["associatedTime"] if pet.has_key?("response")
      unless pet.issues.blank?
        pet.issues.each do |issue|
          it.issues << Issue.where(:id => issue.id).first_or_create({:name => issue.name})
        end
      end
      it.save!
    end
  end
  
  
end