class PetitionsController < ApplicationController
  
  before_filter :special_ranges
  
  def index
    start_date = Time.at(params[:start].to_i).utc
    end_date = Time.at(params[:end].to_i).utc
    @petitions = Petition.where(['created_at >= ?', start_date]).
                          where(['deadline_at <= ?', end_date]).
                          order_by_signatures
  end

  def show
    start_date = Time.at(params[:start].to_i).utc
    end_date = Time.at(params[:end].to_i).utc
    @petitions = Issue.find(params[:id]).petitions.
                       where(['created_at >= ?', start_date]).
                       where(['deadline_at <= ?', end_date]).
                       order_by_signatures
  end
  
  private
  
  def special_ranges
    [:start, :end].each do |timestamp|
      params[timestamp] = case params[timestamp].to_i
                          when 0
                            Date.parse("Sept 1, 2011").to_time.to_i
                          when 1
                            # represents Time.now.to_i
                            Time.now.to_i
                          else
                            # leave alone
                            params[timestamp]
                          end
    end
  end
  
end
