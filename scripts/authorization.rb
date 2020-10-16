require 'nice_hash'
require 'json'

require_relative './common.rb'
require_relative './providers.rb'

data = ARGV[0].json

gateway = setup_provider(data[:provider])

params = data[:params]

setup_hash = {
    payment_sum: Integer(params[0]),
    currency: params[1],
    payer_id: params[2],
    token: params[3]
}

response = gateway.authorize(Integer(params[0]), setup_hash)

result = {
    error: nil,
    data: nil
}

if response.success?
    result.data = {
        transaction_id: response.params.transaction_id
    }
else
    result.error = response.message.to_s
end

puts result.to_json
