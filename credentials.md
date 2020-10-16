# Credentials

Each connected service requires credentials to be provided to work.

When running the service, you can provide the credentials either via config options
or via environment variables.

If you are using environment variables, you have to use `__` as a separator between objects.

## Service credentials

Here is an example excerpt from the config containing PayPalExpressCheckout credentials.

```json
{
  "payments": {
    "gateways": {
      "PayPalExpressCheckout": {
        "login": "sb-login.business.example.com",
        "password": "password",
        "signature": "signature"
      }
    }
  }
}
```

Here is how you can provide the same credentials via environment variables:

```shell script
payments__gateways__PayPalExpressCheckout__login="sb-login.business.example.com" \
  payments__gateways__PayPalExpressCheckout__password="password" \
  payments__gateways__PayPalExpressCheckout__signature="signature" \
  npm run start
```

## Test credentials

Here is an example excerpt from the config containing PayPalExpressCheckout credentials.

```json
{
  "payments": {
    "tests": {
      "PayPalExpressCheckout": {
        "email": "personal@test.example.com",
        "password": "password"
      }
    }
  }
}
```

Here is how you can provide the same credentials via environment variables:

```shell script
payments__tests__PayPalExpressCheckout__email="personal@test.example.com" \
  payments__tests__PayPalExpressCheckout__password="password" \
  npm run test
```

Note that if you are providing service credentials via environment variables,
you need to append them to the test command as well!
