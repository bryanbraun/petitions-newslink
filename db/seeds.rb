# Update all petitions
before = Petition.count
Petition.update_all
after = Petition.count
puts message = "Petitions before and after: #{before} / #{after}"
Rails.logger.info "DB:SEED ran: #{message}"