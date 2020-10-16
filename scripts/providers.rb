require 'active_merchant'

$providers = {
    'PayPalExpressCheckout': {
        'gateway': ActiveMerchant::Billing::PaypalExpressGateway,
        'setup_authorization': 'setup_authorization',
        'setup_purchase': 'setup_purchase',
        'details_for': 'details_for',
        'authorize': 'authorize',
        'purchase': 'purchase'
    }
}

def setup_provider(options)
  $providers[options[:name].to_sym][:gateway].new(options[:credentials])
end
