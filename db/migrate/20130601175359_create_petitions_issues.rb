class CreatePetitionsIssues < ActiveRecord::Migration
  def change
    create_table :issues_petitions, :id => false do |t|
      t.references :issue
      t.references :petition
    end
  end
end