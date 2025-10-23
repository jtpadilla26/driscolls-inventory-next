// Formats GBP nicely everywhere in the app.
export const gbp = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
});
