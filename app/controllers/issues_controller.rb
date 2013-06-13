class IssuesController < ApplicationController
    
  def index
    @issues = Issue.all
  end
  
  def show
    if 0 == params[:id].to_i
      aggregate_issue = Issue.where(id: 0, name: 'All').first_or_create
      aggregate_issue.petitions << Petition.all
      @issues = aggregate_issue
    else
      @issues = Issue.find(params[:id])
    end
  end
  
end


# @resolution = params[:resolution] # in days
# @starting = params[:start] # timestamp
