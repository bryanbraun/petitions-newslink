class CreateIssues < ActiveRecord::Migration
  def change
    create_table :issues, :force => true do |t|
      t.string :name
      t.integer :petitions_count
      t.timestamps
    end
  end
end

__END__
name            "Firearms"
petitions_count 3432
timestamps