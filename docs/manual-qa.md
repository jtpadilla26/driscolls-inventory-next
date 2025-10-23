# Manual QA - Checkout Flow

The following smoke tests were executed against the updated checkout experience.

1. **Cart management**
   - Navigate to `/checkout` while authenticated.
   - Confirm that inventory items and locations load without console errors.
   - Select an item and location, enter a quantity, and click **Add to cart**.
   - Verify that the item appears in the cart summary with the chosen quantity.
   - Change the quantity inline and ensure it updates immediately.
   - Remove the item and confirm the cart summary reflects the change.
2. **Validation messaging**
   - Attempt to submit the form with an empty cart and observe the inline error banner.
   - Provide an invalid user UUID and ensure the field-level error message renders.
3. **Successful submission**
   - Fill in a valid user UUID, purpose, optional return date, and add at least one cart item.
   - Submit the form and expect a success banner with the checkout reference ID and recent checkout card populated from the API response.
   - Verify that the cart is cleared and only the purpose/return date fields reset.
4. **API error handling**
   - Temporarily disconnect network connectivity (or mock a failure) and submit the form to confirm the destructive banner displays the Supabase error message and the cart remains intact.

These steps confirm the new API route, Supabase integration, and UI state management behave as expected.
