require 'nice_hash'
require 'json'

require_relative './common.rb'
require_relative './providers.rb'

data = ARGV[0].json

gateway = setup_provider(data[:provider])

params = data[:params]

setup_hash = {
    ip: params[0],
    subtotal: Integer(params[1]),
    shipping: Integer(params[2]),
    handling: Integer(params[3]),
    tax: Integer(params[4]),
    currency: params[5],
    return_url: params[6],
    cancel_return_url: params[7],
    allow_guest_checkout: params[8],
    items: params[9]
}

amount = params[1].to_i + params[2].to_i + params[3].to_i + params[4].to_i
response = gateway.setup_authorization(amount, setup_hash)

result = {
    error: nil,
    data: nil
}

if response.success?
  result.data = {
      token: response.token,
      url: gateway.redirect_url_for(response.token)
  }
else
  result.error = response.message.to_s
end

puts result.to_json
