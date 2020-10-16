require 'nice_hash'
require 'json'

require_relative './common.rb'
require_relative './providers.rb'

data = ARGV[0].json

gateway = setup_provider(data[:provider])

params = data[:params]

response = gateway.capture(Integer(params[0]), params[1])

result = {
    error: nil,
    data: nil
}

unless response.success?
    result.error = response.message.to_s
end

puts result.to_json
