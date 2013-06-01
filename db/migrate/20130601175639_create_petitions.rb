class CreatePetitions < ActiveRecord::Migration
  def change
    create_table :petitions, :force => true do |t|
      t.string :identifier
      t.string :title
      t.time :deadline_at
      t.time :responded_at
      t.string :url, :limit => 255
      t.integer :signature_count
      t.timestamps
    end
  end
end

__END__
identifier      "50cb6d2ba9a0b1c52e000017"
created_at      Time.now      # created
updated_at      Time.now
deadline_at     Time.now      # deadline
responded_at    Time.now    # response.associationTime
url             "https://petitions.whitehouse.gov/petition/immediately-address-issue-gun-control-through-introduction-legislation-congress/2tgcXzQC"
signature_count 92309458
