const generateInvoiceNumber = () => {
  const timestamp = Date.now();

  const randomNumber = Math.floor(1000 + Math.random() * 9000);

  return `INV-${timestamp}-${randomNumber}`;
};

module.exports = generateInvoiceNumber;
