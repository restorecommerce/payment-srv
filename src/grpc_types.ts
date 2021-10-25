export interface SetupRequest {
  ip: string;
  items: [Item];
  subtotal: number;
  shipping: number;
  handling: number;
  tax: number;
  currency: string;
  return_url: string;
  cancel_return_url: string;
  allow_guest_checkout: boolean;
  provider: Provider;
}

export interface Status {
  id: string;
  code: number;
  message: string;
}

export interface OperationStatus {
  code: number;
  message: string;
}

export interface SetupPayload {
  token: string;
  confirm_initiation_url: string;
  initiated_on: string;
}

export interface SetupPayloadStatus {
  payload: SetupPayload;
  status: Status;
}

export interface SetupResponse {
  item?: SetupPayloadStatus;
  operation_status: OperationStatus;
}

export interface PaymentRequest {
  provider: Provider;
  payment_sum: number;
  currency: string;
  payment_id: string;
  payer_id: string;
  token: string;
}

export interface CaptureRequest {
  provider: Provider;
  payment_sum: number;
  currency: string;
  payment_id: string;
}

export interface PaymentPayload {
  payment_id: string;
  executed_on: string;
}

export interface PaymentPayloadStatus {
  payload: PaymentPayload;
  status: Status;
}

export interface PaymentResponse {
  item?: PaymentPayloadStatus;
  operation_status: OperationStatus;
}

export interface PaymentCard {
  primary_number: string;
  first_name: string;
  last_name: string;
  month: string;
  year: number;
  verification_value: string;
}

export interface Item {
  name: string;
  description: string;
  quantity: number;
  amount: number;
}

export enum Provider {
  NO_PROVIDER = 0,
  Adyen = 1,
  AuthorizeNetCIM = 2,
  AuthorizeNet = 3,
  AxcessMS = 4,
  Balanced = 5,
  BamboraAsiaPacific = 6,
  BankFrick = 7,
  Banwire = 8,
  BarclaysePDQExtraPlus = 9,
  Be2Bill = 10,
  Beanstreamcom = 11,
  BluePay = 12,
  Borgun = 13,
  Braintree = 14,
  BridgePay = 15,
  Cardknox = 16,
  CardSave = 17,
  CardStream = 18,
  Cashnet = 19,
  Cecabank = 20,
  Cenpos = 21,
  CAMSCentralAccountManagementSystem = 22,
  Checkoutcom = 23,
  Clearhaus = 24,
  Commercegate = 25,
  Conekta = 26,
  CyberSource = 27,
  DIBS = 28,
  DataCash = 29,
  Efsnet = 30,
  ElavonMyVirtualMerchant = 31,
  ePay = 32,
  EVOCanada = 33,
  eWAY = 34,
  eWAYRapid = 35,
  Exact = 36,
  Ezic = 37,
  FatZebra = 38,
  FederatedCanada = 39,
  FinansbankWebPOS = 40,
  Flo2Cash = 41,
  stPayGatewayNet = 42,
  FirstDataGlobalGatewaye4 = 43,
  FirstGiving = 44,
  GarantiSanalPOS = 45,
  GlobalTransport = 46,
  HDFC = 47,
  HeartlandPaymentSystems = 48,
  iATSPayments = 49,
  InspireCommerce = 50,
  InstaPay = 51,
  IPP = 52,
  Iridium = 53,
  iTransact = 54,
  JetPay = 55,
  Komoju = 56,
  LinkPoint = 57,
  LitleCo = 58,
  maxiPago = 59,
  MerchanteSolutions = 60,
  MerchantOneGateway = 61,
  MerchantWARE = 62,
  MerchantWarrior = 63,
  Mercury = 64,
  MetricsGlobal = 65,
  MasterCardInternetGatewayServiceMiGS = 66,
  ModernPayments = 67,
  MONEI = 68,
  Moneris = 69,
  MoneyMovers = 70,
  NABTransact = 71,
  NELiXTransaX = 72,
  NetRegistry = 73,
  BBSNetaxept = 74,
  NETbilling = 75,
  NETPAYGateway = 76,
  NMI = 77,
  Ogone = 78,
  Omise = 79,
  Openpay = 80,
  OptimalPayments = 81,
  OrbitalPaymentech = 82,
  Pagarme = 83,
  PagoFacil = 84,
  PayConex = 85,
  PayGatePayXML = 86,
  PayHub = 87,
  PayJunction = 89,
  PaySecure = 90,
  PayboxDirect = 91,
  Payeezy = 92,
  Payex = 93,
  PaymentExpress = 94,
  PAYMILL = 95,
  PayPalExpressCheckout = 96,
  PayPalExpressCheckoutUK = 97,
  PayPalPayflowPro = 98,
  PayPalPaymentsProUS = 99,
  PayPalPaymentsProUK = 100,
  PayPalWebsitePaymentsProCA = 101,
  PayPalExpressCheckoutforDigitalGoods = 102,
  Payscout = 103,
  Paystation = 104,
  PayWay = 105,
  PayUIndia = 106,
  PinPayments = 107,
  PlugnPay = 108,
  Psigate = 109,
  PSLPaymentSolutions = 110,
  QuickBooksMerchantServices = 111,
  QuickBooksPayments = 112,
  QuantumGateway = 113,
  QuickPay = 114,
  Qvalent = 115,
  Raven = 116,
  Realex = 117,
  Redsys = 118,
  S5 = 119,
  SagePay = 120,
  SagePaymentSolutions = 121,
  SallieMae = 122,
  SecureNet = 123,
  SecurePay = 124,
  SecurePayTech = 125,
  SecurionPay = 126,
  SkipJack = 127,
  SoEasyPay = 128,
  Spreedly = 129,
  Stripe = 130,
  Swipe = 131,
  TNS = 132,
  TransactPro = 133,
  TransFirst = 134,
  Transnational = 135,
  Trexle = 136,
  TrustCommerce = 137,
  USAePay = 138,
  VancoPaymentSolutions = 139,
  Verifi = 140,
  ViaKLIX = 141,
  WebPay = 142,
  WePay = 143,
  Wirecard = 144,
  WorldpayGlobal = 145,
  WorldpayOnline = 146,
  WorldpayUS = 147,
}

export enum PaymentIdType {
  NO_IDENTIFIER_TYPE = 0,
  TOKEN = 1,
  TRANSACTION_ID = 2
}

export enum Errors {
  INVALID_INTENT = 'Invalid intent in request',
  NO_PAYER_ID = 'No payer Id in request'
}

export interface Call<T = SetupRequest | PaymentRequest | CaptureRequest> {
  request: T;
}
